import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { DEMO_OTP } from "@/lib/store";

export function OtpStep({ phone, onVerified, onBack }: { phone: string; onVerified: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Enter the 4-digit code sent to <b className="text-foreground">+91 {phone}</b>.</p>
      <InputOTP maxLength={4} value={otp} onChange={(v) => { setOtp(v); setErr(""); }}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((i) => <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />)}
        </InputOTPGroup>
      </InputOTP>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <p className="text-xs text-muted-foreground">Demo code: {DEMO_OTP}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button className="flex-1" disabled={otp.length < 4} onClick={() => (otp === DEMO_OTP ? onVerified() : setErr("Incorrect code. Try again."))}>Verify</Button>
      </div>
    </div>
  );
}
