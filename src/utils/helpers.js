export function getAvatarClass(name) {
  if (!name) return "avatar-accent";
  const classes = ["avatar-accent", "avatar-blue", "avatar-green", "avatar-gold"];
  return classes[name.charCodeAt(0) % classes.length];
}
