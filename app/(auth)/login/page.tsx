"use client"

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })
export default function LoginPage(){
  const form = useForm({ resolver: zodResolver(schema), defaultValues:{ email:'', password:'' } })
  const onSubmit = form.handleSubmit(async (v)=>{
    try {
      const { signIn } = await import('next-auth/react');
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next') || '/dashboard'
      const r = await signIn('credentials', { redirect: false, email: v.email, password: v.password });
      if(r?.error) throw new Error(r.error);
      window.location.href = next;
    } catch (e) { alert((e as any).message) }
  })
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>Đăng nhập vào Copee</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input placeholder="Email" type="email" {...form.register('email')} />
          <Input placeholder="Mật khẩu" type="password" {...form.register('password')} />
          <Button className="w-full" type="submit">Đăng nhập</Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">Chưa có tài khoản? Đăng ký</CardFooter>
    </Card>
  )
}