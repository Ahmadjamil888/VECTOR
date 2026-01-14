"use client"

import Link from "next/link"
import Image from "next/image"
import { BoxIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main>
        <section className="px-6 md:px-10 pt-16 md:pt-24 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
              The AI workspace for data scientists.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              The best way to work with data using AI. Analyze, edit, and publish in one place with delightful UX and strong privacy.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Built for data scientists, analysts, and ML engineers.
            </p>
            <div className="mt-8">
              <div className="flex gap-3">
                <Link href="/signup">
                  <Button className="rounded-full px-5 py-6 text-base">
                    Get started free
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" className="rounded-full px-5 py-6 text-base">
                    View web demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-12 md:mt-16">
            <div className="relative w-full min-h-screen">
              <div className="mx-auto rounded-2xl bg-card p-4 md:p-6 border-4 border-primary/30 shadow-lg">
                <div className="rounded-xl bg-background border-4 border-border/60">
                  <div className="flex items-center justify-between px-4 py-3 border-b-4 border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                      <span className="ml-3 text-xs text-muted-foreground">Vector Dashboard</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Static demo</div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 p-4">
                    <div className="rounded-lg bg-card border p-4">
                      <div className="text-sm text-muted-foreground">Navigation</div>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li className="flex items-center justify-between p-2 rounded border">
                          <span>Overview</span>
                          <span className="text-xs text-muted-foreground">Active</span>
                        </li>
                        <li className="flex items-center justify-between p-2 rounded border">
                          <span>Your Datasets</span>
                          <span className="text-xs text-muted-foreground">12</span>
                        </li>
                        <li className="flex items-center justify-between p-2 rounded border">
                          <span>Published</span>
                          <span className="text-xs text-muted-foreground">3</span>
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-lg bg-card border p-4">
                      <div className="text-sm text-muted-foreground">Editor</div>
                      <div className="mt-3 rounded-lg border p-3 font-mono text-xs">
                        <div>sales_q2.csv</div>
                        <div className="mt-2 text-muted-foreground">id, product, qty, revenue</div>
                        <div className="mt-2">Apply: remove duplicates, normalize headers, fill missing values</div>
                        <div className="mt-3">
                          <Button size="sm" className="bg-primary text-primary-foreground">Run</Button>
                          <Button size="sm" variant="outline" className="ml-2">Preview</Button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="h-24 rounded border flex items-end gap-1 p-2">
                          <div className="w-2 bg-primary/60 h-6" />
                          <div className="w-2 bg-primary/60 h-10" />
                          <div className="w-2 bg-primary/60 h-16" />
                          <div className="w-2 bg-primary/60 h-8" />
                          <div className="w-2 bg-primary/60 h-14" />
                        </div>
                        <div className="h-24 rounded border p-2">
                          <div className="h-full w-full rounded bg-muted" />
                        </div>
                        <div className="h-24 rounded border p-2">
                          <div className="h-full w-full rounded bg-muted" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-card border p-4">
                      <div className="text-sm text-muted-foreground">Insights</div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="text-xs">Outliers detected</div>
                          <div className="text-xs text-muted-foreground">7 rows</div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="text-xs">Null values fixed</div>
                          <div className="text-xs text-muted-foreground">142 cells</div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="text-xs">Columns normalized</div>
                          <div className="text-xs text-muted-foreground">5 columns</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="rounded border p-3 text-xs">
                            Storage used: 45MB / 100MB
                            <div className="mt-2 h-2 w-full rounded bg-muted">
                              <div className="h-2 bg-primary rounded" style={{ width: "45%" }} />
                            </div>
                          </div>
                          <div className="rounded border p-3 text-xs">
                            Datasets: 2 / 3
                            <div className="mt-2 h-2 w-full rounded bg-muted">
                              <div className="h-2 bg-primary rounded" style={{ width: "66%" }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 right-6 w-[360px] rounded-xl bg-card border-4 p-4 shadow-xl">
                <div className="text-sm text-muted-foreground">Assistant</div>
                <div className="mt-2 text-xs font-mono">
                  Suggest: join with customers.json on customer_id; then aggregate revenue by region.
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="bg-primary text-primary-foreground">Apply suggestion</Button>
                  <Button size="sm" variant="outline">Dismiss</Button>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        <section id="features" className="px-6 md:px-10 py-16 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-semibold">Features</h2>
              <Link href="/dashboard">
                <Button variant="ghost">Explore Dashboard</Button>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3 mt-8">
              <div className="rounded-xl border bg-card p-6">
                <div className="text-sm text-muted-foreground">Editing</div>
                <div className="mt-2 text-lg font-medium">AI-assisted data edits</div>
                <p className="mt-2 text-sm text-muted-foreground">Remove duplicates, normalize columns, and apply transformations.</p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="text-sm text-muted-foreground">Search</div>
                <div className="mt-2 text-lg font-medium">Vector-powered retrieval</div>
                <p className="mt-2 text-sm text-muted-foreground">Embed and search documents with speed and accuracy.</p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="text-sm text-muted-foreground">Publishing</div>
                <div className="mt-2 text-lg font-medium">Share and track usage</div>
                <p className="mt-2 text-sm text-muted-foreground">Publish datasets and monitor downloads and views.</p>
              </div>
            </div>
            <div className="mt-10 rounded-2xl bg-card border-4 border-primary/30 shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b-4 border-border/60 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-muted-foreground">Editor Preview</span>
                </div>
              </div>
              <div className="p-4 grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 font-mono text-xs">
                  dataset.csv
                  <div className="mt-2 text-muted-foreground">id, name, email, purchase_date</div>
                  <div className="mt-3">
                    <Button size="sm" className="bg-primary text-primary-foreground">Fix duplicates</Button>
                    <Button size="sm" variant="outline" className="ml-2">Preview</Button>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="h-40 w-full rounded bg-muted" />
                  <div className="mt-2 text-xs text-muted-foreground">Quality score trend</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="enterprise" className="px-6 md:px-10 py-16 bg-muted/30 border-t min-h-screen">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold">Enterprise</h2>
            <p className="mt-3 text-muted-foreground max-w-3xl">
              Security-first architecture, SSO, role-based access, and tailored deployment options. Integrate with existing data lakes and tooling.
            </p>
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              <div className="rounded-xl bg-card border p-6">
                <div className="text-lg font-semibold">Security-first</div>
                <p className="mt-2 text-sm text-muted-foreground">SSO, role-based access, and least-privilege data controls.</p>
              </div>
              <div className="rounded-xl bg-card border p-6">
                <div className="text-lg font-semibold">Flexible deployment</div>
                <p className="mt-2 text-sm text-muted-foreground">Cloud or private VPC with integrations to lakes and warehouses.</p>
              </div>
              <div className="rounded-xl bg-card border p-6">
                <div className="text-lg font-semibold">Governance</div>
                <p className="mt-2 text-sm text-muted-foreground">Audit logs, approvals, and policy-based publishing.</p>
              </div>
            </div>
            <div className="mt-10 rounded-2xl bg-card border-4 border-primary/30 shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b-4 border-border/60 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-muted-foreground">Audit Log Preview</span>
                </div>
              </div>
              <div className="p-4">
                <div className="rounded-lg border overflow-hidden">
                  <div className="grid grid-cols-4 gap-0 text-xs bg-muted/40">
                    <div className="p-2 border-b">Time</div>
                    <div className="p-2 border-b">User</div>
                    <div className="p-2 border-b">Action</div>
                    <div className="p-2 border-b">Status</div>
                  </div>
                  <div className="grid grid-cols-4 gap-0 text-xs">
                    <div className="p-2 border-b">10:24</div>
                    <div className="p-2 border-b">alice</div>
                    <div className="p-2 border-b">Publish dataset</div>
                    <div className="p-2 border-b">Approved</div>
                    <div className="p-2 border-b">11:02</div>
                    <div className="p-2 border-b">bob</div>
                    <div className="p-2 border-b">Edit columns</div>
                    <div className="p-2 border-b">Compliant</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        

        <section id="resources" className="px-6 md:px-10 py-16 bg-muted/30 border-y min-h-screen">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold">Resources</h2>
            <p className="mt-2 text-muted-foreground">Guides, templates, community tools, and best practices.</p>
            <div className="grid gap-6 md:grid-cols-3 mt-8">
              <div className="rounded-xl border bg-card p-6">
                <div className="text-lg font-medium">Docs</div>
                <p className="mt-2 text-sm text-muted-foreground">Guides and API references.</p>
                <Button variant="ghost" className="mt-3">View</Button>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="text-lg font-medium">Templates</div>
                <p className="mt-2 text-sm text-muted-foreground">Starter projects and examples.</p>
                <Button variant="ghost" className="mt-3">Browse</Button>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="text-lg font-medium">Community</div>
                <p className="mt-2 text-sm text-muted-foreground">Join discussions and get support.</p>
                <Button variant="ghost" className="mt-3">Join</Button>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="text-lg font-medium">Playbooks</div>
                <p className="mt-2 text-sm text-muted-foreground">Step-by-step workflows for common tasks.</p>
                <Button variant="ghost" className="mt-3">Explore</Button>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="text-lg font-medium">Integrations</div>
                <p className="mt-2 text-sm text-muted-foreground">Connect with tools you already use.</p>
                <Button variant="ghost" className="mt-3">See all</Button>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="text-lg font-medium">Best practices</div>
                <p className="mt-2 text-sm text-muted-foreground">Curation guidelines and publishing standards.</p>
                <Button variant="ghost" className="mt-3">Read</Button>
              </div>
            </div>
            <div className="mt-10 rounded-2xl bg-card border-4 border-primary/30 shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b-4 border-border/60 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-muted-foreground">Docs Preview</span>
                </div>
              </div>
              <div className="p-4 grid md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-xs">
                  Getting Started
                  <p className="mt-2 text-muted-foreground">Install, configure, and import datasets.</p>
                </div>
                <div className="rounded-lg border p-4 text-xs">
                  Publishing
                  <p className="mt-2 text-muted-foreground">Push to external hubs with credentials.</p>
                </div>
                <div className="rounded-lg border p-4 text-xs">
                  Governance
                  <p className="mt-2 text-muted-foreground">Set policies and review changes.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="px-6 md:px-10 py-16 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold">Testimonials</h2>
            <div className="relative mt-8 h-[60vh] marquee mask-fade">
              <div className="absolute inset-0 flex flex-col gap-4">
                <div className="rounded-xl border bg-card p-6 mx-auto w-full md:w-2/3 marquee-item" style={{ animationDelay: "0s" }}>
                  <p className="text-sm">&quot;Vector helped us clean and publish datasets 5x faster.&quot;</p>
                  <div className="mt-3 text-xs text-muted-foreground">Head of Data, FinTech Co.</div>
                </div>
                <div className="rounded-xl border bg-card p-6 mx-auto w-full md:w-2/3 marquee-item" style={{ animationDelay: "2s" }}>
                  <p className="text-sm">&quot;The AI editing tools are a game changer for our workflows.&quot;</p>
                  <div className="mt-3 text-xs text-muted-foreground">Lead Scientist, BioLab</div>
                </div>
                <div className="rounded-xl border bg-card p-6 mx-auto w-full md:w-2/3 marquee-item" style={{ animationDelay: "4s" }}>
                  <p className="text-sm">&quot;Publishing to external hubs was seamless with built-in integrations.&quot;</p>
                  <div className="mt-3 text-xs text-muted-foreground">Founder, Open Data Org</div>
                </div>
                <div className="rounded-xl border bg-card p-6 mx-auto w-full md:w-2/3 marquee-item" style={{ animationDelay: "6s" }}>
                  <p className="text-sm">&quot;The best AI data workspace we&apos;ve tried.&quot;</p>
                  <div className="mt-3 text-xs text-muted-foreground">Analytics Lead, Retail</div>
                </div>
              </div>
            </div>
            <div className="mt-10 rounded-2xl bg-card border-4 border-primary/30 shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b-4 border-border/60 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-muted-foreground">Customer Stories Preview</span>
                </div>
              </div>
              <div className="p-4 grid md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-xs">
                  FinTech Co.
                  <p className="mt-2 text-muted-foreground">5x faster publishing pipeline.</p>
                </div>
                <div className="rounded-lg border p-4 text-xs">
                  BioLab
                  <p className="mt-2 text-muted-foreground">Automated cleaning workflows.</p>
                </div>
                <div className="rounded-lg border p-4 text-xs">
                  Open Data Org
                  <p className="mt-2 text-muted-foreground">Seamless integrations and governance.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        

          <section id="subscription" className="px-6 md:px-10 py-16 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold">Subscription Plans</h2>
            <p className="mt-2 text-muted-foreground">Choose the plan that fits your data science needs.</p>
            <div className="grid gap-6 md:grid-cols-3 mt-8">
              <div className="flex flex-col glow-box bg-card/50 border-muted rounded-xl border p-6">
                <div className="text-xl font-semibold">Free</div>
                <div className="text-sm text-muted-foreground">For hobbyists and students</div>
                <div className="mt-4 text-4xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <ul className="grid gap-2 text-sm mt-4">
                  <li className="flex items-center gap-2">✓ 3 Datasets</li>
                  <li className="flex items-center gap-2">✓ Basic Cleaning Agents</li>
                  <li className="flex items-center gap-2">✓ 100MB Storage</li>
                  <li className="flex items-center gap-2">✓ Community Support</li>
                </ul>
                <Button variant="outline" className="mt-6 w-full">Current Plan</Button>
              </div>
              <div className="flex flex-col relative border-primary shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-card/80 rounded-xl border p-6">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                  Most Popular
                </div>
                <div className="text-xl font-semibold">Pro</div>
                <div className="text-sm text-muted-foreground">For professional data scientists</div>
                <div className="mt-4 text-4xl font-bold text-primary">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <ul className="grid gap-2 text-sm mt-4">
                  <li className="flex items-center gap-2">✓ Unlimited Datasets</li>
                  <li className="flex items-center gap-2">✓ Advanced AI Agents (Groq Llama 3)</li>
                  <li className="flex items-center gap-2">✓ 10GB Storage</li>
                  <li className="flex items-center gap-2">✓ Priority Support</li>
                  <li className="flex items-center gap-2">✓ API Access</li>
                </ul>
                <Button className="mt-6 w-full bg-primary text-primary-foreground shadow-[0_0_15px_rgba(168,85,247,0.5)]">Upgrade to Pro</Button>
              </div>
              <div className="flex flex-col glow-box bg-card/50 border-muted rounded-xl border p-6">
                <div className="text-xl font-semibold">Enterprise</div>
                <div className="text-sm text-muted-foreground">For large teams and organizations</div>
                <div className="mt-4 text-4xl font-bold">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <ul className="grid gap-2 text-sm mt-4">
                  <li className="flex items-center gap-2">✓ Everything in Pro</li>
                  <li className="flex items-center gap-2">✓ Custom AI Models</li>
                  <li className="flex items-center gap-2">✓ 1TB Storage</li>
                  <li className="flex items-center gap-2">✓ 24/7 Dedicated Support</li>
                  <li className="flex items-center gap-2">✓ SSO & Audit Logs</li>
                </ul>
                <Button variant="outline" className="mt-6 w-full">Contact Sales</Button>
              </div>
            </div>
          </div>
        </section>
      </main>



        <section className="px-6 md:px-10 py-16 min-h-screen">
          <div className="max-w-6xl mx-auto rounded-2xl bg-card p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-2xl font-semibold">Try Early Access</h3>
                <p className="mt-2 text-muted-foreground">Experience new features before general release.</p>
              </div>
              <div className="flex gap-3">
                <Link href="/contact">
                  <Button>Contact</Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline">Read more</Button>
                </Link>
              </div>
            </div>
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="rounded-xl bg-background border p-6">
                <div className="text-sm text-muted-foreground">Agent preview</div>
                <div className="mt-3 rounded-lg border p-4 font-mono text-xs">
                  Turn ideas into transformations and publishing actions. Draft edits and preview safely.
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="bg-primary text-primary-foreground">See how</Button>
                    <Button size="sm" variant="outline">Learn more</Button>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-background border p-6">
                  <div className="text-sm text-muted-foreground">Window</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded border p-3 text-xs">Dataset quality score: 92</div>
                  <div className="rounded border p-3 text-xs">Suggested publish tags: finance, quarterly</div>
                  <div className="rounded border p-3 text-xs">Compliance checks passed: 12</div>
                  <div className="rounded border p-3 text-xs">Reviewers assigned: 3</div>
                </div>
              </div>
            </div>
          </div>
        </section>
   
       

      <footer className="px-6 md:px-10 py-10 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-2 font-semibold">
              <Image src="/images/logo.png" alt="Vector" width={32} height={32} className="h-8 w-8 rounded-lg dark:hidden" />
              <Image src="/images/logo-dark-mode.png" alt="Vector" width={32} height={32} className="h-8 w-8 rounded-lg hidden dark:block" />
              <span>Vector</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Link href="#subscription" className="hover:text-foreground">Pricing</Link>
              <Link href="#features" className="hover:text-foreground">Features</Link>
              <Link href="#resources" className="hover:text-foreground">Resources</Link>
              <Link href="#enterprise" className="hover:text-foreground">Enterprise</Link>
              <Link href="/login" className="hover:text-foreground">Sign in</Link>
              <Link href="/signup" className="hover:text-foreground">Sign up</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
            </div>
          </div>
          <div className="mt-6 text-xs text-muted-foreground">© 2026 Vector Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
