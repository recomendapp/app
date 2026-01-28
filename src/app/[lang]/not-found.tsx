import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

export default async function NotFound() {
  return (
    <div
      className="w-full h-full min-h-screen flex justify-center items-center"
    >
      <div className="flex flex-col justify-center items-center">
        <p className="text-4xl font-bol">
          {'Sadly, we could not find the page you were looking for.'}
        </p>
        <Button className="mt-6" asChild>
          <Link href="/">{'Go back to Home'}</Link>
        </Button>
      </div>
    </div>
  );
}
