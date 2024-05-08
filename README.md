# CAplayer
This is a simulator for various Cellular Automata made with HTML, CSS, and JavaScript.

When in draw mode, place cells by clicking on the grid with the primary mouse button. Change states with the menu next to the draw button, and "auto" switches  between states 0 and 1.

When in move mode, navigate by clicking and dragging the grid.

When in select mode, select an area by clicking and dragging the edges. 

There are several other features included in dropdown labeled **Other Actions**:

- **Select All** selects the entire region containing the current pattern.
- **Fit View** positions the grid so the entire pattern is visible.
- **Copy** saves a pattern which can be pasted.
- **Cut** copies then clears an area.
- **Paste** places a copied pattern onto the grid, which can be clicked and dragged by the cursor.
- **Randomize** sets the state of cells in the selected area to state 1 or 0 randomly.
-  **Clear** sets all the cells in a area to state 0.
- **Invert** switches the state of cells in a selected area.
- **Set Marker** will place a marker on top of the selected area or pattern to be pasted which can be used to setup searches.
- **Delete Marker** will remove the selected marker.

One can also **Undo** changes, **Redo** changes, and **Reset** the pattern to how it was before it was played.

### Keyboard Controls:
- **enter** to start/stop
- **n** to play next generation
- **wasd** Keys to navigate
- **]** to zoom in
- **[** to zoom out
- **1** to enter draw mode
- **2** to enter move mode
- **3** to enter select mode
- **x** to cut to the internal clipboard
- **c** to copy to the internal clipboard
- **v** to paste from the internal clipboard
- **ctrl-c** to copy to the system clipboard
- **ctrl-v** to paste from the system clipboard
- **z** to undo
- **z** and **Shift** to redo
- **t** to reset the pattern
- **r** to randomize the selected area or rotate the paste area clockwise
- **shift-r** rotate the paste area counter-clockwise
- **k** to clear
- **i** to invert states 0 and 1
- **m** to set a marker
- **delete** to delete a selected marker
- **shift-s** select the entire pattern
- **f** to fit the window to the pattern or flip the paste area horizontally
- **shift-f** to fit the window to the pattern or flip the paste area vertically

### Additional info about the "More options"

- The clipboard slots are the storage space used by copy, cut, paste, and a few other features. It shows which pattern is being used for the features listed previously. Selecting the last slot of creates a new slot which can be used to store patterns.

- **Enable Grid Lines** draws a grid of lines across the pattern, and can be disabled for minor performance gains.

- **Prevent Strobing in B0 Rules** switches the color of the background state to prevent the area surrounding the pattern from flashing rapidly. With or without this setting, certain patterns can still contain flashing images.

- **Enable Debugging Visuals** shows the underlying quadtree data structure of the simulation, as well as information about the internal hashtable.

- **Pause simulation when user resets grid** does what it says, otherwise the simulation continues to run after reset by the user.

#### Randomize Options
- **Density of Live Cells** sets the probability of a cell being state 1 when randomized

#### Search Options
These options can be used to assist with manual searches or create fully automated searches. After each generation the program reads all the lines from top to bottom, and performs the listed action if the conditions are met.

**Vertical space between saved patterns** defines how many empty lines are inserted before each additional saved pattern's RLE.

**Allow user reset to trigger search actions** will conditionally perform any search actions which have "Reset" as a condition.

The actions include:
- **Reset** resets the simulation to it's initial state.
- **Shift** moves the provided area, and if a paste area is active, pastes the pattern.
- **Randomize** randomizes the provided area.
- **Save** adds the pattern's RLE to the box at the bottom.
- **Generate Salvo** produces a salvo of ships. To set it up input the minimum repeat time in generations for one ship to come after another. Then select either a marker or a active pattern to be pasted. It has to contain the ship and be large entire evolution for one cycle.
- **Increment Area** runs the grid inside the provided area for one generation.

The conditions include:
- **Pattern Stabilizes** checks if the entire simulation has become an oscillator or still life.
- **Generation** is true if the simulation has reached the listed generation.
- **Population** is true if the simulation has a certain population of live cells.
- **Pattern Contains** checks if the pattern in the provided clipboard slot is located within the provided area.
- **Reset** is true if one of the above actions reset the simulation.

#### Miscellaneous Options

**Identify Pattern** will try to find the period and displacement of the selected pattern, or the entire grid if nothing is selected.

**Enable Dark** toggles the dark color scheme

**Export Options** will export most information about the current state of the program as a hyperlink.
