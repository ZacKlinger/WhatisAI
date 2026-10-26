const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix an absolute site path with the deploy base (e.g. /WhatisAI). */
export function url(path = '/'): string {
  if (/^https?:\/\//.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${p}` || '/';
}

export function moduleUrl(id: string): string {
  return url(`/learn/${id}/`);
}
