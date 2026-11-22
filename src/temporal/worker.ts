import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { TASK_QUEUE_NAME } from './client';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || '127.0.0.1:7233';

export async function startWorker() {
  try {
    const connection = await NativeConnection.connect({
      address: TEMPORAL_ADDRESS,
    });

    const worker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: TASK_QUEUE_NAME,
      workflowsPath: require.resolve('./workflows'),
      activities,
    });

    console.log(`[Temporal Worker] Listening on queue: ${TASK_QUEUE_NAME}`);
    await worker.run();
  } catch (err: any) {
    console.warn(`[Temporal Worker] Worker could not connect to Temporal (${err.message}).`);
  }
}

if (require.main === module) {
  startWorker();
}
