import Bull, { Job, JobOptions, Queue, JobCounts, JobStatusClean } from "bull";
import { log } from "../services/logger.service";
import { MessageJob } from "../types";
import { Message } from "@prisma/client";
import { config } from "../config";
export class MessageQueue {
  private queue: Queue<MessageJob>;
  private isConnected: boolean = false;
  constructor(name: string) {
    this.queue = new Bull<MessageJob>(name, this.getRedisConfig());
    this.setupEventListeners();
    this.validateConnection();
  }
  private getRedisConfig(): Bull.QueueOptions {
    return {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        username: config.redis.username,
        password: config.redis.password,
        connectTimeout: 10000,
        maxRetriesPerRequest: null, 
        enableReadyCheck: false,   
        tls: {   
          rejectUnauthorized: false,
        },
        reconnectOnError: (err) => {
          log.error('Redis connection error:', err);
          return true;
        }
      }
    };
  }
  
  private async validateConnection(): Promise<void> {
    try {
      await this.queue.client.ping();
      this.isConnected = true;
      log.info('Successfully connected to Redis');
    } catch (error) {
      this.isConnected = false;
      log.error('Failed to connect to Redis:', error);
      throw new Error('Redis connection failed');
    }
  }

  private setupEventListeners(): void {
    this.queue.on("failed", this.onJobFailed.bind(this));
    this.queue.on("completed", this.onJobCompleted.bind(this));
    this.queue.on("progress", this.onJobProgress.bind(this));
  }

  public async add(data: any, options?: JobOptions) {
    console.log("gettting in queue");
    try {
      const job = await this.queue.add(data, options);
      log.info(`Job added successfully: ${job.id}`);
      return job;
    } catch (error) {
      this.handleError("Failed to add job", error);
      throw error;
    }
  }
  private onJobFailed(job: Job<MessageJob>, err: Error): void {
    log.error(`Failed job ${job.id}: ${err.message}`);
  }

  private onJobCompleted(job: Job<MessageJob>, result: any): void {
    log.info(`Completed job ${job.id}: ${JSON.stringify(result)}`);
  }

  private onJobProgress(job: Job<MessageJob>, progress: number): void {
    log.info(`Job ${job.id} progress: ${progress}%`);
  }
  private handleError(MessageJob: string, error: unknown): void {
    log.error(`${MessageJob}: ${(error as Error).message}`);
  }
  async startProcessing(
    processor: (job: Job<MessageJob>) => Promise<MessageJob>,
    concurrency: number = 1
  ) {
    log.info("queue processor running...");
    this.queue.process(concurrency, async (job) => {
      try {
        await job.progress(10);
        const result = await processor(job);
        await job.progress(100);
        return result;
      } catch (error) {
        this.handleError("Error processing job", error);
      }
    });
  }
  async waitForCompletion(jobId: Bull.JobId): Promise<Message> {
    return new Promise((resolve, reject) => {
      this.queue
        .getJob(jobId)
        .then((job) => {
          if (!job) {
            reject(new Error(`Job with ID ${jobId} not found`));
            return;
          }

          const checkJobStatus = async () => {
            const status = await job.getState();
            if (status === "completed") {
              const result = await job.finished();
              resolve(result);
            } else if (status === "failed") {
              const failedReason = job.failedReason;
              reject(new Error(failedReason));
            } else {
              setTimeout(checkJobStatus, 1000);
            }
          };

          checkJobStatus();
        })
        .catch(reject);
    });
  }
}
