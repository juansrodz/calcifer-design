// Story-only gestures: a drag dispatched as touch or pointer events, with real timers between the
// moves so Base UI's Drawer measures the drag's speed as it would a finger's.

export type PointerKind = 'touch' | 'mouse' | 'pen';

export interface SwipeOptions {
  /** Horizontal travel in px. */
  deltaX?: number;
  /** Vertical travel in px; positive is down. */
  deltaY?: number;
  /** The time the moves take, in ms. */
  durationMs?: number;
  /** How many move events carry the travel. */
  steps?: number;
  kind?: PointerKind;
  /** The element whose centre the drag starts on; the target's own centre when left out. */
  startAt?: Element;
}

interface Point {
  clientX: number;
  clientY: number;
}

/** One finger or pointer down at a point, moved, then lifted. */
interface Gesture {
  move(point: Point): void;
  end(point: Point): void;
}

const POINTER_IDS: Record<Exclude<PointerKind, 'touch'>, number> = { mouse: 1, pen: 2 };

function pause(durationMs: number): Promise<void> {
  return new Promise((resume) => setTimeout(resume, durationMs));
}

function centreOf(element: Element): Point {
  const box = element.getBoundingClientRect();
  return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
}

/** A touch keeps its first target for the whole gesture, as a finger's does. */
function touchGesture(target: Element, start: Point): Gesture {
  const touchAt = (point: Point) => new Touch({ identifier: 1, target, ...point });
  const send = (type: string, touches: Touch[], changed: Touch) => {
    target.dispatchEvent(
      new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches,
        targetTouches: touches,
        changedTouches: [changed],
      }),
    );
  };
  const first = touchAt(start);
  send('touchstart', [first], first);
  return {
    move(point) {
      const touch = touchAt(point);
      send('touchmove', [touch], touch);
    },
    end(point) {
      send('touchend', [], touchAt(point));
    },
  };
}

/** A pointer's moves and release go to whatever is under it, as an uncaptured pointer's do. */
function pointerGesture(target: Element, start: Point, kind: 'mouse' | 'pen'): Gesture {
  const send = (type: string, eventTarget: Element, point: Point, pressed: boolean) => {
    eventTarget.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: POINTER_IDS[kind],
        pointerType: kind,
        isPrimary: true,
        ...point,
        button: type === 'pointermove' ? -1 : 0,
        buttons: pressed ? 1 : 0,
        pressure: pressed ? 0.5 : 0,
      }),
    );
  };
  const elementAt = (point: Point) =>
    target.ownerDocument.elementFromPoint(point.clientX, point.clientY) ?? target;
  send('pointerdown', target, start, true);
  return {
    move(point) {
      send('pointermove', elementAt(point), point, true);
    },
    end(point) {
      send('pointerup', elementAt(point), point, false);
    },
  };
}

/**
 * Presses and makes the moves across `durationMs`, then holds the drag until `release()`. Drawer
 * takes the first move as the drag's origin, so it lands on the start point and the last on the end.
 */
export async function swipeStage(
  target: Element,
  options: SwipeOptions,
): Promise<{ release(): Promise<void> }> {
  const {
    deltaX = 0,
    deltaY = 0,
    durationMs = 200,
    steps = 10,
    kind = 'touch',
    startAt = target,
  } = options;
  const start = centreOf(startAt);
  const pressed = target.ownerDocument.elementFromPoint(start.clientX, start.clientY) ?? target;
  const gesture =
    kind === 'touch' ? touchGesture(pressed, start) : pointerGesture(pressed, start, kind);
  const end = { clientX: start.clientX + deltaX, clientY: start.clientY + deltaY };
  const moveCount = Math.max(0, Math.round(steps));
  if (moveCount === 0) {
    await pause(durationMs);
  }
  for (let moveIndex = 0; moveIndex < moveCount; moveIndex += 1) {
    await pause(durationMs / moveCount);
    const share = moveCount === 1 ? 1 : moveIndex / (moveCount - 1);
    gesture.move({
      clientX: start.clientX + deltaX * share,
      clientY: start.clientY + deltaY * share,
    });
  }
  return {
    async release() {
      gesture.end(end);
      // Lets the release's state updates and style changes land before the caller reads them.
      await pause(0);
    },
  };
}

/** A whole drag: press, move, lift. */
export async function swipe(target: Element, options: SwipeOptions): Promise<void> {
  const drag = await swipeStage(target, options);
  await drag.release();
}
