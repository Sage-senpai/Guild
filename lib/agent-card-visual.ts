import type { AgentCardGradient } from "@/lib/types";

// Design system brand gradients — Deep Teal × Sea Green × Crimson palette
const GRADIENT_BACKGROUND: Record<AgentCardGradient, string> = {
  aurora: "linear-gradient(135deg, #0E2931 0%, #2B7574 100%)",
  sunset: "linear-gradient(135deg, #861211 0%, #12484C 100%)",
  ocean:  "linear-gradient(135deg, #12484C 0%, #2B7574 70%, #4a9e9d 100%)",
  ember:  "linear-gradient(135deg, #861211 20%, #2B7574 100%)",
  cosmic: "linear-gradient(135deg, #0E2931 0%, #861211 50%, #2B7574 100%)",
};

export function cardBackgroundImage(
  cardImageDataUrl: string | null,
  cardGradient: AgentCardGradient,
): string {
  if (cardImageDataUrl) {
    return `url("${cardImageDataUrl}")`;
  }
  return GRADIENT_BACKGROUND[cardGradient];
}
