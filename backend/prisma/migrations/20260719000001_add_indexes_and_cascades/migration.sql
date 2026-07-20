-- AlterForeignKey
ALTER TABLE "EventApproval" DROP CONSTRAINT "EventApproval_coordinatorId_fkey";
ALTER TABLE "EventApproval" ADD CONSTRAINT "EventApproval_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Club_createdById_idx" ON "Club"("createdById");

-- CreateIndex
CREATE INDEX "EventApproval_eventId_idx" ON "EventApproval"("eventId");

-- CreateIndex
CREATE INDEX "EventApproval_coordinatorId_idx" ON "EventApproval"("coordinatorId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Volunteer_eventId_idx" ON "Volunteer"("eventId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
