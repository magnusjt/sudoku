# Sudoku

Done:

GUI:
- Ability to enter digits and candidates manually while still using solver (solver keeps a separate board with all candidates)
- Multi input/removal of candidates and add to selection using keyboard shortcut
- Set input mode using keyboard shortcuts and buttons
- Interaction with solver:
    - Turn on/off
    - Ability to display which techniques are possible for the current board (but not show the solution)
    - Ability to skip past easy techniques
- Auto removes affected digits
- Checks for errors (against actual solution)
- Undo
- Choose a sudoku from pre generated
- Save progress
- Digit selection outside the grid
- Display technique descriptions
- Import/export save data
- Input custom board

Supported solvers:
- Basic sudoku eliminations
- Naked/hidden singles
- Pointers / inverse pointers (also called locked candidates either pointing or claiming)
- Subsets (naked/hidden pair, triple, quad)
- Fish (x-wing, swordfish, jellyfish)
- w-wing
- xy wing
- xyz wing
- BUG+1
- Unique rectangle type 1
- Hidden rectangles (seems to show up in some extremely hard puzzles)
- Empty rectangle, also with 2 candidates
- Skyscraper
- remote pair chain
- Simple Coloring (special case of x chains where only conjugate pairs are considered. Can be solved with one or more x chains as well)
- x chain
- xy chain
- discontinuous nice loop (also grouped)
- continuous nice loop (also grouped)
- alternate inference chain type 1 and 2 (also grouped)
- Brute force

Generate sudokus:
- Find out if the sudoku has a unique solution
- Require a certain technique
- Choose difficulty (adds techniques into different difficulty buckets, and requires them for solutions randomly based on difficulty)
- Re-analyze boards when added more solvers etc.

Optimize solvers:
- Don't generate rows/cols each time. Can be precalculated. (didn't actually do much)

Bugs:
- none atm

# TODO

GUI/Solver:
- Solver actors/effects can display the candidates as well, not just the cell. But maybe it's nice to have to work for it a bit?

GUI:
- Mobile
- Color tool
- Filter on technique instead of difficulty

Generate sudokus:
- Better name generation
- Check for duplicate boards
- Check for symmetrically identical boards? (rotation, mirroring, digit shift)
- Find rare techniques like jellyfish

Add support for solvers (still can't solve everything without brute force): 
- 2-string kite (This is just an x chain with 4 cells, but quite a bit easier to spot)
- Finned fish
- Sashimi fish
- Chains needs optimizations so we can check more of them. Right now we have hard limits on depth and breadth to avoid spending too much time.
- ALS (almost locked set. Find the one thing missing for a different technique, and use that in a chain)


Probably won't implement these:
- Various more complicated fish (kraken fish, frankenfish)
- Uniqueness:
  - Unique rectangle type 2-6 (very rare it seems)
  - Unique rectangle with missing candidates (requires checking what digits are given)
  - Avoidable rectangle 1-2
- Multi coloring (x-chains is probably about as easy?)
- sue de coq (two-sector disjoint subsets. Extremely rare apparently)
- Various crazy shiz that no human would do that is just about the same as brute force