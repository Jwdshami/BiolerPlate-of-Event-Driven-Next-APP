"use client";

import { useState } from "react";
import { useSignIn, useSignUp} from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";






function SignIn() {
    const { isLoaded } = useSignUp();
     const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
   const [active, setActive] = useState(false);s
    
     const router = useRouter();

  if (!isLoaded ) {
    return null;
  }
  

  async function submit(e: React.FormEvent) {

    e.preventDefault();
    if (!isLoaded) {
      return;
    }

    try {
      const result =await signIn.create({
        identifier: emailAddress,
        password,
      });
if (result.status === "complete") {
    await setActive({ session: result.createdSessionId });
    router.push("/dashboard");
  } else {
    setError("Sign in failed. Please try again.");  
}

    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors[0].message);
    }

  }     

  return (
    <div>
      
    </div>
  )
}

export default SignIn
