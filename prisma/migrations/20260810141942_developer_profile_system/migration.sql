-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "CollaborationPreference" AS ENUM ('INDIVIDUAL', 'TEAM', 'BOTH');

-- CreateEnum
CREATE TYPE "ProjectSizePreference" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'ANY');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'DEVELOPERS_ONLY', 'PRIVATE');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "collaborationPreference" "CollaborationPreference",
ADD COLUMN     "preferredProjectSize" "ProjectSizePreference",
ADD COLUMN     "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "workMode" "WorkMode";

-- AlterTable
ALTER TABLE "UserSkill" ADD COLUMN     "yearsOfExperience" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DeveloperRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDeveloperRole" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserDeveloperRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LookingFor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LookingFor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLookingFor" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "lookingForId" TEXT NOT NULL,

    CONSTRAINT "UserLookingFor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperRole_name_key" ON "DeveloperRole"("name");

-- CreateIndex
CREATE INDEX "UserDeveloperRole_roleId_idx" ON "UserDeveloperRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDeveloperRole_profileId_roleId_key" ON "UserDeveloperRole"("profileId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "LookingFor_name_key" ON "LookingFor"("name");

-- CreateIndex
CREATE INDEX "UserLookingFor_lookingForId_idx" ON "UserLookingFor"("lookingForId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLookingFor_profileId_lookingForId_key" ON "UserLookingFor"("profileId", "lookingForId");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");

-- CreateIndex
CREATE INDEX "UserInterest_interestId_idx" ON "UserInterest"("interestId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterest_profileId_interestId_key" ON "UserInterest"("profileId", "interestId");

-- AddForeignKey
ALTER TABLE "UserDeveloperRole" ADD CONSTRAINT "UserDeveloperRole_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDeveloperRole" ADD CONSTRAINT "UserDeveloperRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "DeveloperRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLookingFor" ADD CONSTRAINT "UserLookingFor_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLookingFor" ADD CONSTRAINT "UserLookingFor_lookingForId_fkey" FOREIGN KEY ("lookingForId") REFERENCES "LookingFor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
