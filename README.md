# Sudoku

Supported solvers:
- Basic sudoku eliminations
- Naked/hidden singles
- Pointers / inverse pointers (also called locked candidates either pointing or claiming)
- Subsets (naked/hidden pair, triple, quad)
- Fish (x-wing, swordfish, jellyfish)
- xy-wing
- xyz-wing
- Unique rectangle type 1
- Empty rectangle, also with 2 candidates

# TODO

Solvers:
- 2-string kite
- Finned fish
- Sashimi fish
- Various more complicated fish
- Unique rectangle type 2-6
- Unique rectangle with missing candidates (requires checking what digits are given)
- Avoidable rectangle 1-2
- BUG+1
- w-wing
- sue de coq (two-sector disjoint subsets)
- Coloring (basically chains)
- Chains
- ALS (almost locked set. Find the one thing missing for a different technique, and use that in a chain)
- Various crazy shiz that no human would do that is just about the same as brute force
- Brute force