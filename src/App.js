import { useState } from 'react';

function Square({value, onSquareClick}) {
  return <button className="square" onClick={onSquareClick}>{value}</button>;
}

export default function Board() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [isX, toggleIsX] = useState(true);
  function isFinished( sq ) {
    if( sq[0] != null && sq[0] === sq[1] && sq[1] === sq[2] ) return true;
    if( sq[3] != null && sq[3] === sq[4] && sq[4] === sq[5] ) return true;
    if( sq[6] != null && sq[6] === sq[7] && sq[7] === sq[8] ) return true;
    if( sq[0] != null && sq[0] === sq[3] && sq[3] === sq[6] ) return true;
    if( sq[1] != null && sq[1] === sq[4] && sq[4] === sq[7] ) return true;
    if( sq[2] != null && sq[2] === sq[5] && sq[5] === sq[8] ) return true;
    if( sq[0] != null && sq[0] === sq[4] && sq[4] === sq[8] ) return true;
    if( sq[6] != null && sq[6] === sq[4] && sq[4] === sq[2] ) return true;
    return false;
  }
  function handleClick(index){
    if(squares[index] != null){return;}
    const nextSquares = squares.slice();
    nextSquares[index] = isX ? "X" : "O";
    setSquares(nextSquares);
    toggleIsX(!isX);
    if( isFinished(nextSquares) ){
      console.log("Finished!");
      setSquares(Array(9).fill(null));
    }
  }
  return (
    <>
      <div className="board-row">
      <Square value={squares[0]} onSquareClick={()=>handleClick(0)}/>
        <Square value={squares[1]} onSquareClick={()=>handleClick(1)}/>
        <Square value={squares[2]} onSquareClick={()=>handleClick(2)}/>
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={()=>handleClick(3)}/>
        <Square value={squares[4]} onSquareClick={()=>handleClick(4)}/>
        <Square value={squares[5]} onSquareClick={()=>handleClick(5)}/>
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={()=>handleClick(6)}/>
        <Square value={squares[7]} onSquareClick={()=>handleClick(7)}/>
        <Square value={squares[8]} onSquareClick={()=>handleClick(8)}/>
      </div>
    </>
  );
}