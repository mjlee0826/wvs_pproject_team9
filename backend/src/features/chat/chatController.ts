import { Request, Response, NextFunction } from 'express';
import * as chatService from './chatService';
import { broadcastChatMessage } from './chatSocket';

export const getRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[Chat] getRooms sub=${req.user!.sub}`);
    const rooms = await chatService.getRooms();
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = Number(req.params.id);
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 30;
    console.log(`[Chat] getMessages roomId=${roomId} cursor=${cursor} limit=${limit}`);
    const result = await chatService.getMessages(roomId, cursor, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = Number(req.params.id);
    const { content } = req.body as { content: string };
    console.log(`[Chat] sendMessage roomId=${roomId} sub=${req.user!.sub}`);
    const message = await chatService.sendMessage(roomId, req.user!.sub, content);
    broadcastChatMessage(roomId, message);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};