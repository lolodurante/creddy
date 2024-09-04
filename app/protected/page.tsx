import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { revalidatePath } from 'next/cache'
import { createReminder, getReminders, deleteReminder, updateReminderStatus, getUser } from '@/app/db'
import { signOut } from "next-auth/react"
import { auth } from "../auth"


async function addReminder(formData: FormData, ) {
  'use server'
  
  const session = await auth()
  const userMail = session?.user?.email
  if (!userMail) {
    return <div>Loading...</div>
  }
  const dueDate = new Date(formData.get('dueDate') as string)
  const newReminder = {
    daysBeforeDue: parseInt(formData.get('daysBeforeDue') as string, 10),
    userName: formData.get('userName') as string,
    userEmail: formData.get('userEmail') as string,
    emailBody: formData.get('emailBody') as string,
    dueDate: dueDate,
    createdBy: userMail, 
  }

  await createReminder(newReminder)
  revalidatePath('/reminders')
}

async function handleDeleteReminder(id: number) {
  'use server'
  await deleteReminder(id)
  revalidatePath('/reminders')
}

export default async function RemindersPage() {
  const session = await auth()
  const userMail = session?.user?.email
  if (!userMail) {
    return <div>Loading...</div>
  }
  const reminders = await getReminders(userMail)

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Reminders</h1>

      </div>
      
      <form action={addReminder} className="mb-6 p-4 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Create New Reminder</h2>
        <div className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="daysBeforeDue" className="text-right">
              Days Before Due
            </label>
            <Input
              id="daysBeforeDue"
              name="daysBeforeDue"
              type="number"
              min="1"
              required
              className="col-span-3"
              aria-describedby="daysBeforeDueHint"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="dueDate" className="text-right">
              Due Date
            </label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              required
              className="col-span-3"
              aria-describedby="dueDateHint"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="userName" className="text-right">
              Name
            </label>
            <Input
              id="userName"
              name="userName"
              required
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="userEmail" className="text-right">
              Email
            </label>
            <Input
              id="userEmail"
              name="userEmail"
              type="email"
              required
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <label htmlFor="emailBody" className="text-right pt-2">
              Email Body
            </label>
            <Textarea
              id="emailBody"
              name="emailBody"
              required
              className="col-span-3"
              rows={4}
              aria-describedby="emailBodyHint"
            />
          </div>
        </div>
        <Button type="submit" className="mt-4">Create Reminder</Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Days Before Due</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>User Email</TableHead>
            <TableHead>Email Body</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reminders.map((reminder) => (
            <TableRow key={reminder.id}>
              <TableCell>{reminder.daysBeforeDue}</TableCell>
              <TableCell>{reminder.userName}</TableCell>
              <TableCell>{reminder.userEmail}</TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={reminder.emailBody ?? ''}>
                  {reminder.emailBody ?? ''}
                </div>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  reminder.status === 'Sent' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {reminder.status}
                </span>
              </TableCell>
              <TableCell>
                <form action={handleDeleteReminder.bind(null, reminder.id)}>
                  <Button type="submit" variant="destructive" size="sm">Delete</Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}