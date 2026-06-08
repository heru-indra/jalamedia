"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// 1. Definisikan skema validasi menggunakan Zod
const formSchema = z.object({
  username: z.string().min(3, {
    message: "Username minimal harus 3 karakter.",
  }),
  email: z.string().email({
    message: "Format email tidak valid.",
  }),
})

type FormValues = z.infer<typeof formSchema>

export function SimpleForm() {
  // 2. Inisialisasi form menggunakan useForm dan zodResolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  })

  // 3. Definisikan handler untuk submit
  function onSubmit(values: FormValues) {
    // Di sini Anda bisa memanggil API atau melakukan aksi lain
    console.log("[v0] Data yang dikirim:", values)
    alert(`Pendaftaran sukses untuk ${values.username}!`)
    form.reset()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-card text-card-foreground"
      >
        <h2 className="text-xl font-bold">Form Pendaftaran</h2>

        {/* Field Username */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" autoComplete="username" {...field} />
              </FormControl>
              <FormDescription>Ini adalah nama tampilan publik Anda.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          Daftar
        </Button>
      </form>
    </Form>
  )
}
