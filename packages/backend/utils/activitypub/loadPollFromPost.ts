import { QuestionPoll, QuestionPollQuestion } from '../../db.js'
import { logger } from '../logger.js'

async function loadPoll(apObj: any, internalPostObject: any, user: any) {
  let res = false
  if (!apObj || (apObj && apObj.anyOf == undefined && apObj.oneOf == undefined)) {
    return res
  }
  try {
    const multiChoice = apObj?.anyOf != undefined
    const remoteQuestions: any[] = apObj.anyOf ? apObj.anyOf : apObj.oneOf
    const existingPoll = await QuestionPoll.findOne({
      include: [QuestionPollQuestion],
      where: {
        postId: internalPostObject.id
      }
    })
    // sometimes polls dont have expiration date. We set one accordingly
    let endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 70)) // This way the remaining time will be 69 years and a few months on every update of non finish date polls hehe
    if (apObj.closed || apObj.endTime) {
      endDate = new Date(apObj.closed ? apObj.closed : apObj.endTime)
    }
    // we check the poll and if it does not exists we create it
    if (existingPoll) {
      existingPoll.endDate = endDate
      await existingPoll.save()
    }
    const poll = existingPoll
      ? existingPoll
      : await QuestionPoll.create({
        postId: internalPostObject.id,
        endDate: endDate,
        multiChoice: multiChoice
      })
    const questions = existingPoll?.questionPollQuestions
      ? existingPoll.questionPollQuestions
      : await poll.getQuestionPollQuestions()
    if (remoteQuestions.length === questions.length) {
      questions.forEach((elem: any, index: number) => {
        elem.update({
          index: index,
          questionText: remoteQuestions[index].name,
          remoteReplies: remoteQuestions[index].replies.totalItems ? remoteQuestions[index].replies.totalItems : 0,
          questionPollId: poll.id,
          updatedAt: new Date()
        })
        elem.save()
      })
    } else {
      // OH NO! the poll has a different number of things. We will assume that is new
      // just in case we will delete the vote tho
      for await (const question of questions) {
        await question.destroy()
      }
      for await (const [index, question] of remoteQuestions.entries()) {
        await QuestionPollQuestion.create({
          index: index,
          questionText: question.name,
          remoteReplies: question.replies.totalItems ? question.replies.totalItems : 0,
          questionPollId: poll.id
        })
      }
    }
    res = true
  } catch (error) {
    logger.trace({ problem: error, ap: apObj, internalPostObject: internalPostObject })
  }

  return res
}

export { loadPoll }
