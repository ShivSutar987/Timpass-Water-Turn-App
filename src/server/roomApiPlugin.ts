/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

interface SharedRoomData {
  room: any;
  members: any[];
  presence: any[];
  claims: any[];
  events: any[];
  updatedAt: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'shared_rooms.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to init rooms storage dir:', err);
  }
}

function readRooms(): Record<string, SharedRoomData> {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function writeRooms(data: Record<string, SharedRoomData>) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write shared rooms:', err);
  }
}

export function roomApiPlugin(): Plugin {
  return {
    name: 'panipari-room-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // API Endpoint: GET /api/rooms/:code
        if (req.method === 'GET' && url.startsWith('/api/rooms/')) {
          const code = url.replace('/api/rooms/', '').split('?')[0].trim().toUpperCase();
          const rooms = readRooms();
          const found = rooms[code] || Object.values(rooms).find((r) => r.room?.code?.toUpperCase() === code);

          res.setHeader('Content-Type', 'application/json');
          if (found) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: found }));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ success: false, message: `Room with code ${code} not found on server.` }));
          }
          return;
        }

        // API Endpoint: GET /api/rooms
        if (req.method === 'GET' && url === '/api/rooms') {
          const rooms = readRooms();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          const list = Object.values(rooms).map((r) => r.room);
          res.end(JSON.stringify({ success: true, data: list }));
          return;
        }

        // API Endpoint: POST /api/rooms (Save / update room bundle)
        if (req.method === 'POST' && url === '/api/rooms') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const room = payload.room;
              if (!room || !room.code) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Invalid room payload' }));
                return;
              }
              const code = room.code.toUpperCase();
              const rooms = readRooms();
              rooms[code] = {
                room: payload.room,
                members: payload.members || [],
                presence: payload.presence || [],
                claims: payload.claims || [],
                events: payload.events || [],
                updatedAt: Date.now(),
              };
              writeRooms(rooms);

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, code }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        // API Endpoint: POST /api/rooms/:code/join (Add new member from another phone)
        if (req.method === 'POST' && url.startsWith('/api/rooms/') && url.endsWith('/join')) {
          const parts = url.split('/');
          const code = parts[3]?.toUpperCase();
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { member } = JSON.parse(body);
              const rooms = readRooms();
              const roomData = rooms[code] || Object.values(rooms).find((r) => r.room?.code?.toUpperCase() === code);
              if (!roomData) {
                res.statusCode = 404;
                res.end(JSON.stringify({ success: false, message: 'Room not found' }));
                return;
              }
              if (member && !roomData.members.some((m: any) => m.name.toLowerCase() === member.name.toLowerCase())) {
                roomData.members.push(member);
                roomData.events.push({
                  id: 'evt_' + Math.random().toString(36).substring(2, 9),
                  roomId: roomData.room.id,
                  type: 'member_added',
                  memberId: member.id,
                  details: `${member.name} joined the flat via Room Code!`,
                  createdAt: Date.now(),
                });
                roomData.updatedAt = Date.now();
                writeRooms(rooms);
              }
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, data: roomData }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
