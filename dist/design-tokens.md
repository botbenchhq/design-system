---
version: alpha
name: Design system
colors:
  accent: "#1A1A1A"
  accent-hover: "#3D3D3A"
  on-accent: "#FAFAF9"
  surface: "#FAFAF9"
  surface-raised: "#FFFFFF"
  surface-sunken: "#F3F2EF"
  fill: "#ECEBE7"
  on-surface: "#171717"
  muted: "#737373"
  border: "#E5E5E5"
  border-strong: "#8A8A86"
  focus: "#1F5C99"
  success: "#1E6B3A"
  success-subtle: "#E8F2EA"
  warning: "#7A5200"
  warning-subtle: "#F7EEDC"
  danger: "#A8281F"
  danger-subtle: "#F9E9E7"
  info: "#1F5C99"
  info-subtle: "#E6EEF6"
  approval: "#984369"
  approval-subtle: "#FCE9EF"
  blocked: "#6C529E"
  blocked-subtle: "#F0ECFC"
  peer: "#076B70"
  peer-subtle: "#DEF3F4"
  tainted: "#994A1A"
  tainted-subtle: "#FCEBE2"
colors-dark:
  accent: "#EDEDEB"
  accent-hover: "#CFCFCB"
  on-accent: "#171717"
  surface: "#141413"
  surface-raised: "#1C1C1A"
  surface-sunken: "#0E0E0D"
  fill: "#2A2A27"
  on-surface: "#EDEDEB"
  muted: "#A3A3A0"
  border: "#2E2E2B"
  border-strong: "#6B6B67"
  focus: "#86B7EA"
  success: "#7CC796"
  success-subtle: "#15281B"
  warning: "#E0B45C"
  warning-subtle: "#2B2210"
  danger: "#F0928A"
  danger-subtle: "#331917"
  info: "#86B7EA"
  info-subtle: "#14243A"
  approval: "#E396B3"
  approval-subtle: "#301C24"
  blocked: "#B6A1E6"
  blocked-subtle: "#251F32"
  peer: "#4DBCC2"
  peer-subtle: "#0A2829"
  tainted: "#E39C77"
  tainted-subtle: "#311E14"
typography:
  2xs:
    fontFamily: "IBM Plex Sans"
    fontSize: 0.6875rem
    fontWeight: 500
    lineHeight: 1.273
    letterSpacing: 0.02em
  xs:
    fontFamily: "IBM Plex Sans"
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.333
  sm:
    fontFamily: "IBM Plex Sans"
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.385
  mono:
    fontFamily: "IBM Plex Mono"
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.5
  ui:
    fontFamily: "IBM Plex Sans"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  lg:
    fontFamily: "IBM Plex Sans"
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: -0.01em
  xl:
    fontFamily: "IBM Plex Sans"
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.015em
  2xl:
    fontFamily: "IBM Plex Sans"
    fontSize: 1.625rem
    fontWeight: 600
    lineHeight: 1.154
    letterSpacing: -0.02em
fontWeights:
  normal: 400
  medium: 500
  semibold: 600
rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 14px
  full: 9999px
spacing:
  2xs: 2px
  xs: 4px
  xs-sm: 6px
  sm: 8px
  md: 12px
  lg: 16px
  lg-xl: 20px
  xl: 24px
  2xl: 32px
  3xl: 40px
  4xl: 64px
borderWidth: 1px
elevation:
  overlay: "0 8px 24px 0 rgb(0 0 0 / 0.16)"
elevation-dark:
  overlay: "0 8px 24px 0 rgb(0 0 0 / 0.5)"
motion:
  duration:
    fast: 100ms
    base: 160ms
    slow: 240ms
  easing: "cubic-bezier(0.2, 0, 0, 1)"
layers:
  sticky: 100
  overlay: 200
  dialog: 300
  toast: 400
sizes:
  control-xs: 24px
  control-sm: 28px
  control-md: 32px
  control-lg: 40px
  control: 36px
  row: 36px
  touch: 44px
  sidebar: 260px
  inspector: 360px
  column: 480px
  transcript: 720px
  wide: 1200px
density:
  compact:
    control: 28px
    row: 32px
    text: 0.8125rem
    leading: 1.385
  comfortable:
    control: 36px
    row: 36px
    text: 0.875rem
    leading: 1.5
  touch:
    control: 44px
    row: 44px
    text: 0.875rem
    leading: 1.5
  default: comfortable
  coarse-pointer: touch
typography-coarse-pointer:
  2xs: 0.75rem
  xs: 0.8125rem
  sm: 0.875rem
  mono: 0.875rem
  ui: 0.9375rem
  lg: 1.0625rem
  xl: 1.3125rem
  2xl: 1.6875rem
breakpoint: 768px
---
