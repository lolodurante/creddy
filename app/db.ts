import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import { sql } from 'drizzle-orm';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
let db = drizzle(client);

export async function getUser(email: string) {
  const users = await ensureUserTableExists();
  return await db.select().from(users).where(eq(users.email, email));
}

export async function createUser(email: string, password: string) {
  const users = await ensureUserTableExists();
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  return await db.insert(users).values({ email, password: hash });
}

async function ensureUserTableExists() {
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'User'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "User" (
        id SERIAL PRIMARY KEY,
        email VARCHAR(64),
        password VARCHAR(64),
        createdBy VARCHAR(255)
      );`;
  }

  const table = pgTable('User', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 64 }),
    password: varchar('password', { length: 64 }),
    createdBy: varchar('createdBy', { length: 255 }),
  });

  return table;
}

export async function ensureRemindersTableExists() {
  const table = pgTable('Reminders', {
    id: serial('id').primaryKey(),
    daysBeforeDue: integer('daysbeforedue'),
    userName: varchar('username', { length: 64 }),
    userEmail: varchar('useremail', { length: 64 }),
    emailBody: text('emailbody'),
    status: varchar('status', { length: 10 }),
    createdAt: timestamp('createdat').defaultNow(),
    createdBy: varchar('createdby', { length: 255 }),
    dueDate: timestamp('duedate'),
  });

  return table;
}

export async function addReminder(reminder: {
  daysBeforeDue: number;
  userName: string;
  userEmail: string;
  emailBody: string;
  status: 'Pending' | 'Sent';
  createdBy: string;
}) {
  const reminders = await ensureRemindersTableExists();
  return await db.insert(reminders).values(reminder);
}

export async function getReminders(userMail: string) {
  const reminders = await ensureRemindersTableExists();
  return await db.select().from(reminders).where(eq(reminders.createdBy, userMail));
}

export async function updateReminderStatus(id: number, status: 'Pending' | 'Sent') {
  const reminders = await ensureRemindersTableExists();
  return await db
    .update(reminders)
    .set({ status })
    .where(eq(reminders.id, id));
}

export async function deleteReminder(id: number) {
  const reminders = await ensureRemindersTableExists();
  return await db
    .delete(reminders)
    .where(eq(reminders.id, id));
}

export async function createReminder(reminder: {
  daysBeforeDue: number;
  userName: string;
  userEmail: string;
  emailBody: string;
  dueDate: Date;
  createdBy: string;
}) {
  const reminders = await ensureRemindersTableExists();
  return await db.insert(reminders).values({
    ...reminder,
    status: 'Pending'
  });
}

export async function checkAndSendDueReminders() {
  const reminders = await ensureRemindersTableExists();
  const now = new Date();
  const dueReminders = await db
    .select()
    .from(reminders)
    .where(
      sql`${reminders.dueDate} - INTERVAL '1 day' * ${reminders.daysBeforeDue} <= ${now} AND ${reminders.status} = 'Pending'`
    );

  for (const reminder of dueReminders) {
    // Send email logic here
    // You'll need to implement the email sending functionality
    // After sending the email, update the status
    await updateReminderStatus(reminder.id, 'Sent');
  }
}
