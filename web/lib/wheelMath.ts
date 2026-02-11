export const calculateSegmentAngle = (slotCount: number) => {
    return 360 / slotCount;
};

/**
 * Calculate the rotation degree needed to land on a specific index.
 * 
 * @param currentIndex The current index (0-based) to land on
 * @param slotCount Total number of slots
 * @param currentRotation Current rotation in degrees
 * @param spins Number of full spins to add (default 5-8)
 * @returns Final rotation degree
 */
export const calculateFinalRotation = (
    currentIndex: number,
    slotCount: number,
    currentRotation: number,
    spins: number = 8
) => {

    // Target angle for the center of the segment
    // Adjust logic: 0 degrees is commonly 3 o'clock in SVG.
    // We want the pointer at 12 o'clock.
    // Let's assume the pointer is at top (270deg or -90deg in standard unit circle).
    // Or we rotate the wheel so the target segment aligns with the pointer.

    // Simplified logic:
    // Each segment is index * segmentAngle.
    // We want this segment to be at the top (pointer).
    // So we rotate the wheel such that the segment is at the top.

    // If pointer is at top (0 deg visual), and strict 0 index is at 0 deg (top).
    // SVG arcs usually start at 3 o'clock (0 deg).
    // We'll handle visual rotation in CSS.
    // Let's assume standard behavior:
    // Target rotation = current + (360 * spins) + offset_to_target

    // Randomize landing position within the segment? (Optional enhancement)
    // For now, center it.

    // We want to land on 'currentIndex'.
    // The wheel rotates. Pointer is fixed.
    // To bring 'currentIndex' to pointer:
    // If pointer is at 0 (top), and index 0 starts at 0.
    // To bring index 1 (at angle X) to 0, we rotate -X (counter-clockwise) or 360-X (clockwise).

    const anglePerSlot = 360 / slotCount;
    // Calculate where the slot starts currently relative to 0
    // We want the wheel to stop where the pointer points to the random spot inside the slot.
    // Let's assume pointer is at 0 degrees (top).
    // Slot i spans from [i*angle, (i+1)*angle].
    // Center of slot i is (i + 0.5) * angle.
    // To bring center of slot i to 0 deg:
    // Rotation = - (i + 0.5) * angle

    // Add full spins and ensure positive rotation (clockwise)
    const targetRotation = (360 * spins) - ((currentIndex + 0.5) * anglePerSlot);

    // Adjust relative to current rotation to ensure smooth transition
    // We want to add at least 'spins' full rotations.
    // Current rotation might be large (e.g. 3600).
    // New rotation should be > current rotation.

    // Calculate the remainder of current rotation
    const currentMod = currentRotation % 360;
    const targetMod = targetRotation % 360;

    let diff = targetMod - currentMod;
    if (diff < 0) diff += 360;

    // Add spins
    return currentRotation + diff + (360 * spins);
};

export const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
};
