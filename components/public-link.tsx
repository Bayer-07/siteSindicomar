import type { AnchorHTMLAttributes, ReactNode } from "react";

type PublicLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
};

export function PublicLink({ href, children, ...props }: PublicLinkProps) {
  return <a href={href} {...props}>{children}</a>;
}
