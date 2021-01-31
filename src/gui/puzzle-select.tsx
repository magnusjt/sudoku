import React from 'react'
import { BoardMetaData } from '../core/utils/getBoardMetaData'
import Button from '@material-ui/core/Button'
import { difficulties } from '../core/solve'
import { LinearProgress } from '@material-ui/core'

// yea I don't give a fuck about this for now.. :P
let globalPuzzleData: BoardMetaData[] = [];
const loadPuzzleData = async () => {
    globalPuzzleData = await fetch(process.env.PUBLIC_URL + '/boards/boards.txt')
        .then(x => x.text())
        .then(x => x
            .split('\n')
            .filter(line => line.trim().length !== 0)
            .map(line => JSON.parse(line) as BoardMetaData)
        )
}

export type PuzzleSelectProps = {
    onPuzzleSelect: (puzzle: BoardMetaData) => void
}

export const PuzzleSelect = (props: PuzzleSelectProps) => {
    const [puzzleData, setPuzzleData] = React.useState<BoardMetaData[]>(globalPuzzleData)

    const [selectedDifficulty, setSelectedDifficulty] = React.useState('easy')
    const [showTechniques, setShowTechniques] = React.useState(false)

    React.useEffect(() => {
        if(globalPuzzleData.length === 0) {
            loadPuzzleData().then(() => {
                setPuzzleData(globalPuzzleData)
            })
        }
    }, [])

    const puzzles = puzzleData
        .filter(puzzle => puzzle.difficulty.difficulty === selectedDifficulty)
        .sort((a, b) => a.techniques.length - b.techniques.length)

    const maxNumberOfTechniques = Math.max(...puzzles.map(t => t.techniques.length))

    return (
        <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <div>
                <div style={{ display: 'flex'}}>
                {difficulties.map((difficulty) => {
                    return (
                        <div>
                            <Button
                                onClick={() => setSelectedDifficulty(difficulty)}
                                disabled={selectedDifficulty === difficulty}
                            >
                                {difficulty}
                            </Button>
                        </div>
                    )
                })}
                </div>
                <hr />
            </div>
            <div>
                <Button onClick={() => setShowTechniques(!showTechniques)}>
                    Show/Hide techniques required
                </Button>
            </div>
            <div style={{ flex: '1 1 auto', minHeight: 0}}>
                <div style={{ height: '100%', overflowY: 'auto'}}>
                    <table>
                        <thead>
                            <th>#</th>
                            <th>Name</th>
                            <th>Intensity</th>
                            {showTechniques &&
                            <th>Techniques</th>
                            }
                        </thead>
                    {puzzles.map((puzzle, i) => {
                        return (
                            <tr>
                                <td>
                                    {i+1}.
                                </td>
                                <td>
                                    <Button onClick={() => props.onPuzzleSelect(puzzle)}>{puzzle.name}</Button>
                                </td>
                                <td>
                                    <LinearProgress
                                        variant={'determinate'}
                                        value={Math.round(100 * puzzle.techniques.length / maxNumberOfTechniques)}
                                    />
                                </td>
                                {showTechniques &&
                                <td>
                                    {puzzle.techniques.join(', ')}
                                </td>
                                }
                            </tr>
                        )
                    })}
                    </table>
                </div>
            </div>
        </div>
    )
}