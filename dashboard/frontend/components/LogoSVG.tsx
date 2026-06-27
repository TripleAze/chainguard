export function LogoSVG({ height = 36 }: { height?: number }) {
  return (
    <img
      src="/chainguard-logo.png"
      alt="ChainGuard"
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}
