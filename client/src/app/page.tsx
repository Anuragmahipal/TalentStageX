import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <Badge className="mb-4">MVP</Badge>
            <h1 className="text-4xl font-heading font-bold mb-4">Hire top creative and technical freelancers</h1>
            <p className="text-muted-foreground mb-6">Post projects, review proposals, and manage milestones with a simple escrow flow. TalentStage is a lightweight marketplace built for demos and developer testing.</p>

            <div className="flex items-center gap-3">
              <Link href="/auth/signup">
                <Button>Get started</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/projects" className="ml-auto text-sm text-muted-foreground">Browse projects</Link>
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Sign up as a Client or Freelancer.</li>
                  <li>Clients post projects and receive proposals.</li>
                  <li>Use the contract workspace to manage milestones and releases.</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <h3 className="font-semibold">Profiles & Portfolios</h3>
              <p className="text-sm text-muted-foreground mt-2">Create rich freelancer profiles and showcase portfolio projects.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold">Project Posting</h3>
              <p className="text-sm text-muted-foreground mt-2">Post fixed or hourly projects, set milestones, and receive proposals.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold">Escrow & Contracts</h3>
              <p className="text-sm text-muted-foreground mt-2">Simulated escrow keeps funds until milestones are approved.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
