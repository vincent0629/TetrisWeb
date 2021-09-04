import BlockRow from './BlockRow';

function BlockView(props) {
  const model = props.model;

  let rows = [];
  for (let i = 0; i < model.length; ++i)
    rows.push(<BlockRow key={'r' + i} size={props.size} model={model[i]} />);

  return (
    <div className="blockView">
      {rows}
    </div>
  );
}

export default BlockView;
