import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SubscriptionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold glow-text">Subscription Plans</h1>
        <p className="text-muted-foreground">Choose the plan that fits your data science needs.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Free Plan */}
        <Card className="flex flex-col glow-box bg-card/50 border-muted">
          <CardHeader>
            <CardTitle className="text-xl">Free</CardTitle>
            <CardDescription>For hobbyists and students</CardDescription>
            <div className="mt-4 text-4xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="grid gap-2 text-sm">
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> 3 Datasets</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> Basic Cleaning Agents</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> 100MB Storage</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> Community Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">Current Plan</Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="flex flex-col relative border-primary shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-card/80">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
            Most Popular
          </div>
          <CardHeader>
            <CardTitle className="text-xl glow-text">Pro</CardTitle>
            <CardDescription>For professional data scientists</CardDescription>
            <div className="mt-4 text-4xl font-bold text-primary">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="grid gap-2 text-sm">
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> Unlimited Datasets</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> Advanced AI Agents (Groq Llama 3)</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> 10GB Storage</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> Priority Support</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> API Access</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]">Upgrade to Pro</Button>
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className="flex flex-col glow-box bg-card/50 border-muted">
          <CardHeader>
            <CardTitle className="text-xl">Enterprise</CardTitle>
            <CardDescription>For large teams and organizations</CardDescription>
            <div className="mt-4 text-4xl font-bold">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="grid gap-2 text-sm">
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> Everything in Pro</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> Custom AI Models</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> 1TB Storage</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> 24/7 Dedicated Support</li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-primary" /> SSO & Audit Logs</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">Contact Sales</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
