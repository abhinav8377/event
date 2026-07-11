import 'dotenv/config';
import app from './app.js';
import connectDB from './src/common/config/db.js';
import { startLifecycleScheduler } from './src/modules/events/event.lifecycle.js';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    startLifecycleScheduler();
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));
  })
  .catch((err: Error) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
