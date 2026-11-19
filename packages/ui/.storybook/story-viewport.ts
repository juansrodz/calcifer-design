// The viewport a story asks for, read the way Storybook's own viewport toolbar reads it: the story's
// `globals.viewport.value` names one of `parameters.viewport.options`, whose `styles` give the
// width and height. Pure, so Vitest can load it; the test runner's pre-visit hook in
// `paint-checks.ts` sizes the page to it, which the toolbar does for the Storybook UI.

export interface ViewportSize {
  width: number;
  height: number;
}

/** The parts of a prepared story (`getStoryContext`) this reads. */
export interface ViewportStory {
  storyGlobals?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
}

interface ViewportOption {
  styles?: { width?: unknown; height?: unknown };
}

function pixels(value: unknown): number | undefined {
  const match = typeof value === 'string' ? /^(\d+(?:\.\d+)?)px$/.exec(value.trim()) : null;
  return match ? Number(match[1]) : undefined;
}

/**
 * The size of the viewport the story names, or `undefined` when it names none. A named option that
 * is missing or not sized in `px` throws: the story would otherwise run at the runner's
 * default window, and measure nothing it meant to.
 */
export function storyViewportSize(story: ViewportStory): ViewportSize | undefined {
  const selection = story.storyGlobals?.['viewport'] as
    { value?: unknown; isRotated?: unknown } | undefined;
  if (selection?.value === undefined) {
    return undefined;
  }
  const name = String(selection.value);
  const viewportParameters = story.parameters?.['viewport'] as
    { options?: Record<string, ViewportOption> } | undefined;
  const option = viewportParameters?.options?.[name];
  const width = pixels(option?.styles?.width);
  const height = pixels(option?.styles?.height);
  if (width === undefined || height === undefined) {
    throw new Error(
      `story viewport: "${name}" is not a viewport option sized in px (parameters.viewport.options)`,
    );
  }
  return selection.isRotated === true ? { width: height, height: width } : { width, height };
}
