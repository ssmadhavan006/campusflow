-- CreateTable
CREATE TABLE "EventAnnouncement" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAnnouncement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventAnnouncement" ADD CONSTRAINT "EventAnnouncement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex (Event - declared in schema.prisma but never previously migrated)
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_clubId_idx" ON "Event"("clubId");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex (Registration - declared in schema.prisma but never previously migrated)
CREATE INDEX "Registration_eventId_status_idx" ON "Registration"("eventId", "status");

-- CreateIndex
CREATE INDEX "Registration_studentId_idx" ON "Registration"("studentId");

-- CreateIndex
CREATE INDEX "Registration_status_createdAt_idx" ON "Registration"("status", "createdAt");

-- CreateIndex (Attendance - declared in schema.prisma but never previously migrated)
CREATE INDEX "Attendance_eventId_idx" ON "Attendance"("eventId");

-- CreateIndex (ODLetter - declared in schema.prisma but never previously migrated)
CREATE INDEX "ODLetter_eventId_idx" ON "ODLetter"("eventId");

-- CreateIndex
CREATE INDEX "ODLetter_studentId_idx" ON "ODLetter"("studentId");

-- CreateIndex (AuditLog.timestamp - userId/action already added in 20260719000001)
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex (RefreshToken.userId - expiresAt already added in 20260719000001)
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex (Notification - declared in schema.prisma but never previously migrated)
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
