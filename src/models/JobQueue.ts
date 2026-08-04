export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string;
  createdAt: string;
}

export interface JobQueue<T = unknown> {
  enqueue(type: string, payload: T, maxAttempts?: number): Promise<Job<T>>;
  enqueueBatch(type: string, payloads: T[], maxAttempts?: number): Promise<Job<T>[]>;
  dequeue(): Promise<Job<T> | null>;
  acknowledge(jobId: string): Promise<void>;
  fail(jobId: string, error: Error): Promise<void>;
  getStats(): Promise<{ pending: number; processing: number; completed: number; failed: number }>;
}

export class MemoryJobQueue<T = unknown> implements JobQueue<T> {
  private queue: Job<T>[] = [];

  async enqueue(type: string, payload: T, maxAttempts = 3): Promise<Job<T>> {
    const job: Job<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      payload,
      attempts: 0,
      maxAttempts,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.queue.push(job);
    return job;
  }

  async enqueueBatch(type: string, payloads: T[], maxAttempts = 3): Promise<Job<T>[]> {
    const jobs: Job<T>[] = [];
    for (const payload of payloads) {
      const job = await this.enqueue(type, payload, maxAttempts);
      jobs.push(job);
    }
    return jobs;
  }

  async dequeue(): Promise<Job<T> | null> {
    const pendingJob = this.queue.find((j) => j.status === 'PENDING');
    if (pendingJob) {
      pendingJob.status = 'PROCESSING';
      pendingJob.attempts += 1;
      return pendingJob;
    }
    return null;
  }

  async acknowledge(jobId: string): Promise<void> {
    const job = this.queue.find((j) => j.id === jobId);
    if (job) {
      job.status = 'COMPLETED';
    }
  }

  async fail(jobId: string, error: Error): Promise<void> {
    const job = this.queue.find((j) => j.id === jobId);
    if (job) {
      job.error = error.message;
      if (job.attempts >= job.maxAttempts) {
        job.status = 'FAILED';
      } else {
        job.status = 'PENDING'; // Retry
      }
    }
  }

  async getStats(): Promise<{ pending: number; processing: number; completed: number; failed: number }> {
    return {
      pending: this.queue.filter((j) => j.status === 'PENDING').length,
      processing: this.queue.filter((j) => j.status === 'PROCESSING').length,
      completed: this.queue.filter((j) => j.status === 'COMPLETED').length,
      failed: this.queue.filter((j) => j.status === 'FAILED').length,
    };
  }
}
