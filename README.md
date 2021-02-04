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
- Digit selection outside the grid
- Display technique descriptions

Supported solvers:
- Basic sudoku eliminations
- Naked/hidden singles
- Pointers / inverse pointers (also called locked candidates either pointing or claiming)
- Subsets (naked/hidden pair, triple, quad)
- Fish (x-wing, swordfish, jellyfish)
- xy wing
- xyz wing
- Unique rectangle type 1
- Empty rectangle, also with 2 candidates
- Skyscraper
- remote pair chain
- x chain
- xy chain
- Brute force

Generate sudokus:
- Find out if the sudoku has a unique solution
- Require a certain technique
- Choose difficulty (adds techniques into different difficulty buckets, and requires them for solutions randomly based on difficulty)

Optimize solvers:
- Don't generate rows/cols each time. Can be precalculated. (didn't actually do much)

Bugs:
- None (just kidding, or do I? yes, or maybe)

# TODO

GUI/Solver:
- Solver actors/effects can display the candidates as well, not just the cell. But maybe it's nice to have to work for it a bit?

GUI:
- Mobile
- Save progress and/or total points etc. Server side or just local?
- Input custom board
- Eraser tool
- Color tool
- Filter on technique instead of difficulty

Generate sudokus:
- Better name generation
- Check for duplicate boards
- Check for symmetrically identical boards? (rotation, mirroring, digit shift)
- Re-analyze boards when added more solvers etc.
- Find rare techniques like jellyfish

Add support for solvers (maybe skip the most advanced stuff?):
- 2-string kite
- Finned fish
- Sashimi fish
- Various more complicated fish
- Unique rectangle type 2-6
- Unique rectangle with missing candidates (requires checking what digits are given)
- Avoidable rectangle 1-2
- BUG+1
- w-wing (a chain?)
- sue de coq (two-sector disjoint subsets)
- Coloring (basically chains)
- More Chains
- ALS (almost locked set. Find the one thing missing for a different technique, and use that in a chain)
- Various crazy shiz that no human would do that is just about the same as brute force