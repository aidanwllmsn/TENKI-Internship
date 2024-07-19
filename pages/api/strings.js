import getData from '../../utils/getData';

export default function handler(req, res) {
  const data = getData();
  res.status(200).json(data);
}
