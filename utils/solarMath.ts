export const calculatePanelLayout = (
  roofW: number,
  roofH: number,
  panelW: number,
  panelH: number,
  count: number,
  preferredOrientation: string,
  gap: number = 2.5,
) => {
  const layouts = [];
  let placedCount = 0;

  const mainPW = preferredOrientation === "portrait" ? panelW : panelH;
  const mainPH = preferredOrientation === "portrait" ? panelH : panelW;

  const slotW = mainPW + gap;
  const slotH = mainPH + gap;

  const cols = Math.floor((roofW + gap) / slotW);
  const rows = Math.floor((roofH + gap) / slotH);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (placedCount >= count) break;
      layouts.push({
        x: c * slotW,
        y: r * slotH,
        width: mainPW,
        height: mainPH,
        rotated: false,
        isActive: true, // PŘIDÁNO
      });
      placedCount++;
    }
  }

  const usedHeight = rows * slotH;
  const remainingHeight = roofH - usedHeight;

  if (placedCount < count && remainingHeight >= mainPW) {
    const altPW = mainPH;
    const altPH = mainPW;
    const altSlotW = altPW + gap;
    const altSlotH = altPH + gap;

    const altCols = Math.floor((roofW + gap) / altSlotW);
    const altRows = Math.floor((remainingHeight + gap) / altSlotH);

    for (let r = 0; r < altRows; r++) {
      for (let c = 0; c < altCols; c++) {
        if (placedCount >= count) break;
        layouts.push({
          x: c * altSlotW,
          y: usedHeight + r * altSlotH,
          width: altPW,
          height: altPH,
          rotated: true,
          isActive: true, // PŘIDÁNO
        });
        placedCount++;
      }
    }
  }

  return layouts;
};
