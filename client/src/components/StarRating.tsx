"use client";
import React from "react";
import { Star, StarHalf } from "lucide-react";

export default function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      {[...Array(full)].map((_, i) => <Star key={`f-${i}`} size={14} className="text-amber-400" />)}
      {[...Array(half)].map((_, i) => <StarHalf key={`h-${i}`} size={14} className="text-amber-400" />)}
      {[...Array(empty)].map((_, i) => <Star key={`e-${i}`} size={14} className="text-muted-foreground" />)}
      <span className="text-sm text-muted-foreground ml-2">({rating})</span>
    </span>
  );
}
