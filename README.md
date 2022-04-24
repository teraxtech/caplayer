# Arise
This is a simulator for outer-totalistic, generations, elementary, and non-isotropic rules made with HTML, CSS, and JavaScript.

When in draw mode, place cells by clicking on the grid with the primary mouse button. Change states with the menu next to the draw button, and "auto" switches  between states 0 and 1.

When in move mode, navigate by clicking and dragging the grid.

When in select mode, select an area by clicking and dragging the edges. 

**Randomize**, **Clear**, **Invert**, **Cut**, and **Copy** will only affect the highlighted area. Clicking paste once will show you the copied pattern and clicking paste again will place the pattern.

**Restart** will return the pattern to how it was before it was played.

**Set Marker** will create an area which can be used like the selected area for certain features.

### Keyboard Controls:
- **Enter** to start/stop
- **n** to play next generation
- **WASD** Keys to navigate
- **r** to randomize
- **k** to clear
- **i** to invert states 0 and 1
- **+** or **=** to zoom in
- **-** or **_** to zoom out
- **f** to fit the window to the pattern
- **1** to enter draw mode
- **2** to enter move mode
- **3** to enter select mode
- **x** to cut
- **c** to copy
- **v** to paste
- **z** to undo
- **z** and **Shift** to redo
- **t** to reset the pattern

### Additional info about the "More options"

- The copy slot is the storage space used by copy, cut, paste, and a few other features. It shows which pattern is being used for the features listed previously.

- **Enable Grid Lines** draws a grid of lines across the pattern, and can be disabled for minor performance gains.

- **Prevent Strobing in B0 Rules** switches the color of the background state to prevent the area surrounding the pattern from flashing rapidly. With or without this setting, certain patterns can still contain flashing images.

- **Enable Debugging Visuals** shows the underlying quadtree structure of the simulation, as well as a rough visualization of the internal hashtable.

- **Density of Live Cells** sets the probability of a cell being State 1 when randomized

- **Randomize within marker** causes the area within the provided marker to be randomized instead of the selected area

#### Search Options
These options will produce various actions when conditions are met

- **Reset** will reset the simulation
- **Shift** will paste a pattern with some offset relative to the existing pattern to be pasted.
- **Randomize** will randomize the provided area
- **Reset and Save** will reset the simulation *then* export the pattern RLE
- **Generate Salvo** will produce the next possible salvo when reset using the pattern to be pasted

