import mongoose from '../mongoose/index';

const Schema = mongoose.Schema;

const GithubUsersSchema = new Schema({
  userId: String,
  githubId: String,
  reposIds: Array
});

export default mongoose.model('GithubUsers', GithubUsersSchema);
