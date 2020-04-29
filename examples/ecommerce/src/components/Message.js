/* eslint-disable react/prop-types */

const Message = ({ title, message, type }) => (
  <div className={`text-center ${type === 'error' ? 'text-red-500' : 'text-gray-500'} p-10`}>
    <h1 className="mb-4 text-2xl font-semibold text-gray-800">
      {`${title} `}
      <span role="img" aria-label="Sad face">
        😢
      </span>
    </h1>
    <p>{message}</p>
  </div>
);

export default Message;
