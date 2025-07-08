import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { LoginForm } from "./auth/login-form";

export function SidebarOptInForm() {
  return (
    <Dialog>
      <Card className="gap-2 py-4 shadow-none">
        <CardHeader className="px-4">
          <CardTitle className="text-sm">Haven't signed in yet?</CardTitle>
          <CardDescription>
            Sign up to get access to all features, including saving your
            preferences and accessing your history.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          <form>
            <div className="grid gap-2.5">
              <DialogTrigger asChild>
                <Button
                  className="bg-sidebar-primary text-sidebar-primary-foreground w-full shadow-none"
                  size="sm"
                >
                  Sign In
                </Button>
              </DialogTrigger>
            </div>
          </form>
        </CardContent>
      </Card>

      <DialogContent className="max-w-fit">
        <LoginForm />
      </DialogContent>
    </Dialog>
  );
}
