const colors = ['#000000', '#b00000', '#00b000', '#0000b0', '#b0b000', '#00b0b0', '#b000b0', '#c08000'];

function BlockRow(props) {
  const size = props.size;
  const model = props.model;

  let columns = [];
  for (let i = 0; i < model.length; ++i)
    columns.push(<div key={'c' + i} className="block" style={{width:size + 'px', height:size + 'px', background:colors[model[i] + 1]}}></div>);

  return (
    <div className="blockRow" style={{height:size + 'px'}}>
        {columns}
    </div>
  );
}

export default BlockRow;
