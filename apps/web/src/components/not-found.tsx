import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function NotFound() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-start px-6 py-24 sm:py-32">
      <Badge variant="destructive" className="tracking-wide uppercase">
        Error
      </Badge>
      <h1 className="mt-4 text-3xl leading-tight font-semibold text-balance text-foreground sm:text-4xl">
        This route isn't in the cache.
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        Nothing fulfilled at this path. Head back to the homepage, or see the plugin running on the
        examples page.
      </p>
      <div className="mt-8 flex gap-3">
        {/*
          `buttonVariants` rather than the `Button` component: these navigate,
          so they have to stay real links. Base UI's Button offers no way to
          keep that. Composing it onto an anchor with the default
          `nativeButton` warns, and `nativeButton={false}` applies
          `role="button"`, which takes the link semantics away from assistive
          tech. The class helper gives identical styling with none of that.
        */}
        <Link to="/" className={buttonVariants({ size: "sm" })}>
          Go home
        </Link>
        <Link to="/playground" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Open the playground
        </Link>
      </div>
    </main>
  );
}
