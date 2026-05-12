import type { AuthedVisitor } from '@nullv2/auth';

declare global {
  namespace App {
    interface Locals {
      visitor: AuthedVisitor | null;
    }
  }
}

export {};
