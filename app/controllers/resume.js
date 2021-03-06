import Resume from '../models/resumes';
import ResumePub from '../models/resume-pub';
import ShareAnalyse from '../models/share-analyse';

const GITHUB_SECTIONS = ['hotmap', 'info', 'repos', 'languages', 'commits'];

const getResume = async (ctx, next) => {
  const userId = ctx.session.userId;
  const getResult = await Resume.getResume(userId);
  const { message, result } = getResult;
  ctx.body = {
    success: true,
    result
  };
};

const setResume = async (ctx, next) => {
  const { resume } = ctx.request.body;
  const { userId } = ctx.session;

  const setResult = await Resume.updateResume(userId, resume);
  let resumeInfo = null;
  if (setResult.success) {
    // check & add resume share info
    let checkResult = await ResumePub.findPublicResume({ userId });
    if (!checkResult.success) {
      checkResult = await ResumePub.addPubResume(userId);
    }
    resumeInfo = checkResult.success ? {
      url: `resume/${checkResult.result.resumeHash}?locale=${ctx.session.locale}`,
      useGithub: checkResult.result.useGithub,
      openShare: checkResult.result.openShare
    } : null;
  }

  ctx.body = {
    success: true,
    message: ctx.__("messages.success.save"),
    result: resumeInfo
  };
};

const getPubResume = async (ctx, next) => {
  const { hash } = ctx.params;
  const findResume = await ResumePub.getPubResume(hash);
  const { success, result, message } = findResume;

  ctx.body = {
    message,
    result,
    success: true
  };
};

const getPubResumePage = async (ctx, next) => {
  const { hash } = ctx.params;
  const findResume = await ResumePub.checkPubResume({
    resumeHash: hash
  });
  const { success, result } = findResume;
  if (!success) {
    ctx.redirect('/404');
    return;
  }

  await ctx.render('resume/share', {
    title: ctx.__("resumePage.title", result),
    resumeHash: hash
  });
};

const getResumeStatus = async (ctx, next) => {
  const { userId } = ctx.session;
  const findPubResume = await ResumePub.findPublicResume({ userId });
  const { result, success, message } = findPubResume;
  if (!success) {
    ctx.body = {
      error: message,
      success: true,
      result: null
    };
    return
  }

  const { useGithub, resumeHash, openShare, github } = result;
  ctx.body = {
    success: true,
    result: {
      github,
      openShare,
      useGithub,
      url: `resume/${resumeHash}`
    }
  }
};

const setResumeShareStatus = async (ctx, next) => {
  const { enable } = ctx.request.body;
  const { userId } = ctx.session;
  const findPubResume = await ResumePub.findPublicResume({ userId });
  const { result, success, message } = findPubResume;
  if (!success) {
    ctx.body = {
      error: message,
      success: true
    };
    return
  }
  await ResumePub.updatePubResume(userId, result.resumeHash, {
    openShare: enable
  });
  const resultMessage = enable === 'true' ? "messages.share.toggleOpen" : "messages.share.toggleClose"
  ctx.body = {
    success: true,
    message: ctx.__(resultMessage)
  };
};

const setResumeGithubStatus = async (ctx, next) => {
  const { enable } = ctx.request.body;
  const { userId } = ctx.session;
  const findPubResume = await ResumePub.findPublicResume({ userId });
  const { result, success, message } = findPubResume;
  if (!success) {
    ctx.body = {
      error: message,
      success: true
    };
    return
  }
  await ResumePub.updatePubResume(userId, result.resumeHash, {
    useGithub: enable
  });
  const resultMessage = enable === 'true' ? "messages.resume.linkGithub" : "messages.resume.unlinkGithub";
  ctx.body = {
    success: true,
    message: ctx.__(resultMessage)
  };
};

const setGithubShareSection = async (ctx, next) => {
  const { userId } = ctx.session;
  const findPubResume = await ResumePub.findPublicResume({ userId });
  const { result, success, message } = findPubResume;
  if (!success) {
    ctx.body = {
      error: message,
      success: true
    };
    return
  }

  let githubSections = {};
  const { body } = ctx.request;
  Object.keys(body).forEach((key) => {
    if (GITHUB_SECTIONS.some(section => section === key)) {
      githubSections[key] = body[key];
    }
  });

  await ResumePub.updatePubResume(userId, result.resumeHash, {
    github: Object.assign({}, result.github, githubSections)
  });
  ctx.body = {
    success: true
  };
};

const getShareData = async (ctx, next) => {
  const { userId } = ctx.session;
  const findPubResume = await ResumePub.findPublicResume({ userId });
  const { result, success, message } = findPubResume;
  if (!success) {
    ctx.body = {
      error: message,
      success: true,
      result: {
        url: '',
        viewDevices: [],
        viewSources: [],
        pageViews: [],
        openShare: false
      }
    };
    return;
  }

  const shareAnalyse = await ShareAnalyse.findShare({ url: `resume/${result.resumeHash}`, userId });
  const { viewDevices, viewSources, pageViews } = shareAnalyse;
  ctx.body = {
    success: true,
    result: {
      url: `resume/${result.resumeHash}`,
      openShare: result.openShare,
      viewDevices,
      viewSources,
      pageViews,
    }
  };
};

export default {
  getResume,
  setResume,
  getPubResume,
  getPubResumePage,
  getResumeStatus,
  setResumeShareStatus,
  setResumeGithubStatus,
  setGithubShareSection,
  getShareData
}
