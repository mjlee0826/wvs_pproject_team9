import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { initChatSocket } from './features/chat/chatSocket';

const PORT = process.env.PORT ?? 3000;
const httpServer = createServer(app);

initChatSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
