import type { ComponentProps, ComponentPropsWithoutRef, CSSProperties } from "react";
import { getApprovedMediaUrl, type ApprovedMedia } from "@/lib/media/r2";
import Link from "next/link";

/**
 * Website-only Premium Glass components (G02). Opt-in until G03/G05 rollout.
 * Do not import these into apps/admin or unrelated storefronts.
 * All surfaces and motion consume tokens from app/globals.css.
 */
const classes = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");

type SurfaceOptions = {
  /** Uses stronger opacity over detailed backgrounds. */
  strong?: boolean;
  className?: string;
};

type MotionOptions = {
  /** Lift only when fine-pointer hover and reduced motion is not requested. */
  hover?: boolean;
};

type DecorativeBackdropOptions = {
  /** Explicitly selected, approved public R2 banner. Never use a raw R2 key or URL. */
  decorativeMedia?: ApprovedMedia | null;
  /** Public HTTPS media origin provided by an already-published configuration. */
  publicMediaOrigin?: string;
};

/** No approved public configuration => existing lavender gradient, without image requests. */
export function GlassPageBackdrop({
  className,
  decorativeMedia = null,
  publicMediaOrigin,
  style,
  ...rest
}: ComponentPropsWithoutRef<"div"> & DecorativeBackdropOptions) {
  const url = decorativeMedia?.kind === "banner"
    ? getApprovedMediaUrl(decorativeMedia, publicMediaOrigin)
    : null;
  const backdropStyle = url
    ? ({ ...style, "--fb-glass-decorative-image": `url("${url}")` } as CSSProperties)
    : style;
  return <div
    {...rest}
    style={backdropStyle}
    data-decorative={url ? "true" : undefined}
    className={classes("fb-glass-page", "fb-glass-backdrop", className)}
  />;
}

export function GlassHeader({
  strong = true,
  className,
  ...rest
}: ComponentPropsWithoutRef<"header"> & SurfaceOptions) {
  return <header {...rest} className={classes(
    "fb-glass-surface", "fb-glass-header",
    strong && "fb-glass-surface--strong", className
  )} />;
}

export function GlassCard({
  strong = false,
  hover = false,
  className,
  ...rest
}: ComponentPropsWithoutRef<"article"> & SurfaceOptions & MotionOptions) {
  return <article {...rest} className={classes(
    "fb-glass-surface", "fb-glass-card",
    strong && "fb-glass-surface--strong",
    hover && "fb-glass-motion-card", className
  )} />;
}

export function GlassPanel({
  strong = true,
  className,
  ...rest
}: ComponentPropsWithoutRef<"section"> & SurfaceOptions) {
  return <section {...rest} className={classes(
    "fb-glass-surface", "fb-glass-panel",
    strong && "fb-glass-surface--strong", className
  )} />;
}

/** Neutral photo frame: no tinted glass filter over real product imagery. */
export function GlassMediaFrame({
  className,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return <div {...rest} className={classes("fb-glass-media-frame", className)} />;
}

export type GlassButtonVariant = "primary" | "secondary" | "ghost";

type ButtonStyle = {
  variant?: GlassButtonVariant;
  /** Intended for commercial CTAs; ordinary controls retain the shared 9px radius. */
  pill?: boolean;
  className?: string;
};

function buttonClasses(variant: GlassButtonVariant, pill: boolean, className?: string) {
  return classes(
    "fb-glass-button",
    "fb-glass-button--" + variant,
    pill && "fb-glass-button--pill",
    className
  );
}

type GlassButtonProps = Omit<ComponentPropsWithoutRef<"button">, "color"> & ButtonStyle & {
  /** Native disabled, busy state, and stable accessible label while loading. */
  loading?: boolean;
};

export function GlassButton({
  variant = "primary",
  pill = false,
  loading = false,
  disabled = false,
  type = "button",
  className,
  ...rest
}: GlassButtonProps) {
  return <button
    {...rest}
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    data-loading={loading ? "true" : undefined}
    className={buttonClasses(variant, pill, className)}
  />;
}

/** Real navigation; does not simulate click handlers or create inactive links. */
export function GlassButtonLink({
  variant = "primary",
  pill = false,
  className,
  ...rest
}: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link {...rest} className={buttonClasses(variant, pill, className)} />;
}

type ChipOptions = {
  selected?: boolean;
  className?: string;
};

/** Controlled selection: the parent owns SKU/variant state and click behavior. */
export function GlassChip({
  selected = false,
  disabled = false,
  type = "button",
  className,
  ...rest
}: Omit<ComponentPropsWithoutRef<"button">, "color" | "aria-pressed"> & ChipOptions) {
  return <button
    {...rest}
    type={type}
    disabled={disabled}
    aria-pressed={selected}
    data-selected={selected ? "true" : "false"}
    className={classes("fb-glass-chip", className)}
  />;
}

/** Link-based variant navigation, with explicit current state. */
export function GlassChipLink({
  selected = false,
  className,
  ...rest
}: ComponentProps<typeof Link> & ChipOptions) {
  return <Link
    {...rest}
    aria-current={selected ? "true" : rest["aria-current"]}
    data-selected={selected ? "true" : "false"}
    className={classes("fb-glass-chip", "fb-glass-chip--link", className)}
  />;
}
