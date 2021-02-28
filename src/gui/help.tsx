import React from 'react'
import Accordion from '@material-ui/core/Accordion'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import AccordionSummary from '@material-ui/core/AccordionSummary'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'

const basic = `
The basic rules of sudoku are:
The digits 1-9 must occur once in each row, column, and box.
`

const fullHouse = `
A house in sudoku is a row, column, or box. 
When there is only one candidate left in a house, you have a full house. 
Just place the last candidate.
`

const hiddenSingle = `
If a candidate can only go in one cell in a house, and there are still other possible candidates for this cell, it's called a hidden single.
This is an easy technique, especially with highlighting, since the candidate can only go in one cell. 
`

const nakedSingle = `
A naked single is when a cell can only contain one candidate. 
A full house is also a naked single, but we differentiate between the two because proper naked singles are harder to find.
The reason they may be hard to find is that the same candidate can still be possible in other cells in the house.
In some cases it can be really tricky to find, but most often it's fairly easy.
`

const pointer = `
A pointer is when all of a candidate in a box occur on the same line (row or column).
The candidate can be eliminated from the rest of the line outside the box.
`

const inversePointer = `
An inverse pointer is when all of a candidate on a line is within the same box.
The candidate can be eliminated from the rest of the box.
`

const nakedPair = `
A naked pair is when 2 candidates occur in 2 cells of a house, and there are no other candidates in these cells.
The 2 candidates can be eliminated from the rest of the house.
The same logic applies for 3 and 4 candidates in 3 or 4 cells.   
`

const hiddenPair = `
A hidden pair is when the only location for 2 candidates in a house is in the same 2 cells.
The rest of the candidates in these two cells can be eliminated. The same logic applies for 3 and 4 candidates in 3 or 4 cells.

You can spot hidden pairs by looking at each candidate and see if it's represented in only two cells in a house.
Check the house to see if there is a second candidate in those cells as well. Can be quite tricky to spot.
`

const xWingAndOtherFish = `
An x-wing looks like the four corners of a rectangle. The same candidate is in each corner.
The requirement is that either both rows or both columns has the candidate in only the corners.

If both rows, the candidate can be eliminated from the columns.
If both columns, the candidate can be eliminated from the rows.

A more difficult versions exist for when there is 3 rows/cols, called swordfish.
In that case, all points don't need the candidate for it work. 
The only requirement is that all cells has the candidate in the same 3 rows and 3 columns,
and that either all 3 rows has the candidate in only the three columns, or vice versa.

If that wasn't hard enough, there is also a jellyfish with 4 rows/cols as well.

To spot these, use highlighting :) x-wings are pretty easy to find, while swordfish and jellyfish is pretty hard.

...and if that wasn't enough, there's also finned fish, and sashimi fish.

A finned fish happens when you almost have a fish, but there are some extra cells with the candidate in a row/col.
These cells make up a "fin". Quite annoying, but there is hope. 
Check if setting the candidate in the fin would produce the same eliminations as the fish without the fin.
If so, go ahead and make the eliminations!

A finned sashimi fish is more or less the same as a finned fish. 
The only difference is that with sashimi, removing the fin would simply leave a single on that row/col, destroying the fish in the process. 
One could say that the only reason there is a fish in the first place in this case is because there is a fin. 

Side note: You can apply this same trick to most other techniques as well. 
If there is something that annoyingly precludes you from using a technique, check if setting the digit in those other annoying cells has any overlap with the technique you want to use. If so, you can make the elimination! 
`

const swordfish = `
See x-wing
`

const jellyfish = `
See x-wing
`

const skyscraper = `
See x-wing first. A skyscraper is almost the same, except that one corner is not aligned on a row/col.
The row/col that is aligned can still be used to deduce that one of the cells that are not aligned must have the candidate.
If these two cells has any overlap in the cells they affect, the candidate can be eliminated from those cells.
To spot these, look for almost-x-wings.
`

const uniqueRectangle = `
There are many types of unique rectangles, but the easiest one to spot is when you have a naked pair in a row,
and another naked pair in a col, where one of the cells overlap. This forms an L-shape of cells with the same two candidates.
To form a rectangle, we need the last corner. In this corner, the two candidates can be eliminated.
Why? Because otherwise the sudoku cannot be unique, and all sudokus must be unique. 
You'll just have to stare at this for a while to convince yourself it's true

To spot it, look for a naked pair in a row or col. Now look for a second pair originating from this pair.
`

const emptyRectangle = `
The name empty rectangle can be confusing, so let's just explain the technique instead of the name.

Look at a candidate in a box. If it forms an L-shape, we have a possible empty rectangle. (Tip: 2 cells are always L-shaped).
Now look at the same candidate outside the box. Can you find a row or column where there are only two possible cells for this candidate?
If so, check if one of those eliminates an entire leg of the L-shape if set. If it does, the result will be a pointer.
Now check the other cell in the row/col. If this cell "sees" the same cells as the pointer, the candidate can be eliminated from those cells.
`

const bugPlus1 = `
A binary universal grave or BUG is what happens when there are only two candidates in each cell, 
and each of those candidates can only go in one of two cells in each house. 
This situation implies that the sudoku is not unique, and is therefore not a valid state of the board.

A BUG+1 is what happens when you have a BUG, but ONE cell has an additional candidate.
To avoid the BUG, we HAVE to place this candidate in that cell.

To spot a BUG, see if all cells only have two possible candidates, except ONE cell. This usually happens towards the end of the sudoku.
Now see if each of these candidates can go in only two cells in each row/col/box (except the additional candidate).
If so, go ahead and place the additional candidate in the cell where there are three candidates. 
`

const xyWing = `
In an xyWing we only consider cells with 2 possible candidates.
The idea is that you have a "pivot" cell and two "pincers".
The pivot has two candidates, x y. The two pincers both see the pivot, and has candidates x z and y z. In summary, we have the following cells:

pivot: xy
pincer 1: xz
pincer 2: yz

If the pivot had the digit x, the cell x z would be z (since x is eliminated).
If the pivot had the digit y, the cell y z would be z (since y is eliminated).

Therefore, all cells that sees the two pincers can have z eliminated.
`

const xyzWing = `
xyzWing is the same as xyWing, except now the "pivot" can also have the z candidate.
So we have three cells:

pivot: xyz
pincer 1: xz
pincer 2: yz

The difference from xyWing is that now we can only eliminate z from cells that sees both pincers AND the pivot.
`

const remotePairChain = `
Fill in all candidates. 
Find all cells with only two candidates. 
The two candidates must be the same for all cells in the chain, hence "remote pair".
Pick a cell. 

Now start by saying to yourself "candidate A is not true". Look at the connected cells with the same two candidates you found earlier.
Pick one, and say to yourself "candidate A is true". Now continue alternating between these two for each cell you visit.

If at any point you say that the candidate is true, you can check if the cell "sees" the same cells as the cell you started with.
If so, both candidates can be eliminated from those cells.

Why? You started by saying A is NOT true, and ended by saying A IS true. If, however, you start by saying it IS true, the starting cell is true.
So the conclusion is that the candidate is either in the starting cell or the ending cell. 
`

const xChain = `
Fill in all candidates. 
Look at only one candidate. 
Pick a cell with the candidate.
 
Start by saying to yourself "the candidate is NOT true". Now look at cells affected by this cell.
If removing the candidate from the starting cell leads to the candidate being set in a different cell, 
go to that cell and say "the candidate IS true". Now continue like this, alternating between true and not true.

If at any point you say that the candidate is true, you can check if the cell "sees" the same cells as the cell you started with.
If so, the candidate can be eliminated from those cells.

Why? You started by saying the candidate was not true. That lead to the ending cell being true.
The alternative was that the starting cell WAS true. So either the starting cell is true, or the ending cell is true.
`

const xyChain = `
See xChain.

Fill in all candidates. 
Look at only cells with two possible candidates. 
Pick a cell.

Start by saying to yourself, "candidate A is NOT true". Now follow the chain, alternating true/not true. 
If you end up on a cell where the candidate is the same as the starting candidate, and is true, check for cells that "sees" both the start and the end.
The candidate can be eliminated from these points. 
`

const techniqueDescriptions = {
    basic,
    fullHouse,
    hiddenSingle,
    nakedSingle,
    pointer,
    inversePointer,
    nakedPair,
    hiddenPair,
    'xWing and fish in general': xWingAndOtherFish,
    swordfish,
    jellyfish,
    skyscraper,
    uniqueRectangle,
    emptyRectangle,
    bugPlus1,
    xyWing,
    xyzWing,
    remotePairChain,
    xChain,
    xyChain
}

export const Help = (props) => {
    return (
        <div>
            <h3>How to play</h3>
            <Divider />
            <Typography>
                Note: On desktop there are keybinds for most buttons.
                <ul>
                    <li>Digit - Sets/removes a digit in selected cell. If you have selected more than one cell, it sets as candidate instead</li>
                    <li>Candidate - Sets/removes candidate in selected cells</li>
                    <li>Number selectors (1-9) - Sets digit in selected cells. If no cells selected, enabled/disables highlighting for the digit</li>
                    <li>Undo - Undo the last move</li>
                    <li>Deselect all - Deselect any selected cells. Useful if you want number highlighting using the number selector</li>
                    <li>Hints - Toggle hints</li>
                    <li>
                        Solver - Toggle solver. Note that opening the solver will create a new board based on the currently set digits. It will fill in all candidates.
                        But don't worry, when you close the solver you'll get right back to the board you had before opening the solver.
                    </li>
                </ul>
            </Typography>
            <br />
            <h3>Techniques</h3>
            <Divider />
            <Typography>
                Below you'll find some short descriptions and hints for each technique.<br />
                If you want more detailed explanations with examples, I recommend the excellent guide over at

                <a href='http://hodoku.sourceforge.net/en/techniques.php' target='_blank' rel="noopener noreferrer" style={{ color: 'lightblue' }}>
                    <span> HoDoKu</span>
                </a>
            </Typography>
            <br />

            {Object.entries(techniqueDescriptions).map(([name, d]) => {
                return (
                    <Accordion>
                        <AccordionSummary>{name}</AccordionSummary>
                        <AccordionDetails>
                            <Typography>{d.trim().split(/\r\n|\n/g).map(line => (<>{line}<br/></>))}</Typography>
                        </AccordionDetails>
                    </Accordion>
                )
            })}
        </div>
    )
}