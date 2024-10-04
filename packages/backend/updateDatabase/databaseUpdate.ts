import { environment } from "../environment.js";
import { logger } from "../utils/logger.js";

import { Sequelize } from "sequelize"; // sequelize plugins
// @ts-ignore sequelize-hierarchy-fork has no types
import sequelizeHierarchyFork from "sequelize-hierarchy-fork";
sequelizeHierarchyFork(Sequelize);

const sequelize = new Sequelize(environment.databaseConnectionString, {
  logging: !environment.prod,
});

const queryInterface = sequelize.getQueryInterface();

async function dbUpdate() {
  // Add new table
  /*
  await queryInterface.createTable('userLikesPostRelations', {
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      },
      unique: false
    },
    postId: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'posts',
        key: 'id'
      },
      unique: false
    },
    remoteId: {
      type: Sequelize.STRING,
      allowNull: true
    },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
  })
  */
  // add column

  await queryInterface.addColumn("users", "banned", {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    unique: false,
  });
}

/*
 await queryInterface.removeColumn(
  'posts',
  'NSFW'
);
*/

dbUpdate()
  .then(() => {
    logger.info("done");
  })
  .catch((error) => {
    logger.info(error);
  });
