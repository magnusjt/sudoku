import React from 'react'
import { BoardMetaData } from '../core/utils/getBoardMetaData'
import Button from '@material-ui/core/Button'
import { difficulties } from '../core/solve'

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
                    {puzzleData.filter(puzzle => puzzle.difficulty.difficulty === selectedDifficulty).map(puzzle => {
                        return (
                            <tr>
                                <td>
                                    <Button onClick={() => props.onPuzzleSelect(puzzle)}>{puzzle.name}</Button>
                                </td>
                                <td>
                                    {showTechniques && puzzle.techniques.join(', ')}
                                </td>
                            </tr>
                        )
                    })}
                    </table>
                </div>
            </div>
        </div>
    )
}