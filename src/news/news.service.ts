import { Injectable, forwardRef, Inject } from '@nestjs/common';
// import { Comment } from './comments/comments.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from './news.entity';
import { CreateNewsDto } from './dtos/create-news-dto';
import { UsersEntity } from 'src/users/users.entity';
import { UsersService } from 'src/users/users.service';
import { CommentsService } from './comments/comments.service';
import { CreateCommentDto } from './comments/dtos/create-comments-dtos';
import { CommentsEntity } from './comments/comments.entity';

export interface News {
  id?: number;
  title: string;
  description: string;
  comments?: Comment[];
  cover?: string;
}

export interface NewsDto {
  title?: string;
  description?: string;
  cover?: string;
}

export function getRandomInt(min = 1, max = 99999): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsEntity)
    private newsRepository: Repository<NewsEntity>,
    private userService: UsersService,
    @Inject(forwardRef(() => CommentsService))
    private commentsService: CommentsService,
  ) {}

  async create(news: CreateNewsDto): Promise<NewsEntity> {
    const newsEntity = new NewsEntity();
    newsEntity.title = news.title;
    newsEntity.description = news.description;
    newsEntity.cover = news.cover;
    const _user = await this.userService.findById(parseInt(news.userId));
    newsEntity.user = _user;
    return await this.newsRepository.save(newsEntity);
  }

  async findById(id: News['id']): Promise<NewsEntity | null> {
    return await this.newsRepository.findOneBy({ id });
  }

  async getAll(): Promise<NewsEntity[] | undefined> {
    return await this.newsRepository.find();
  }

  async sortAllByUserId(idUser: number): Promise<NewsEntity[] | undefined> {
    return await this.newsRepository.find({
      relations: ['comments', 'user'],
      where: { user: { id: idUser } },
    });
  }

  async remove(id: News['id']): Promise<boolean | Error> {
    try {
      const removingNews = await this.findById(id);
      if (removingNews) {
        const comments = await this.commentsService.findAll(id);
        if (!(comments instanceof Error)) {
          await this.commentsService.removeAllForIdNews(comments);
          await this.newsRepository.delete(id);
          return true;
        }
      }
      return false;
    } catch (error) {
      return new Error(`Произошла ошибка: ${error}`);
    }
  }

  async update(
    id: News['id'],
    news: NewsDto | undefined,
  ): Promise<string | Error | null> {
    try {
      const findNews = await this.findById(id);
      if (findNews) {
        const newsEntity = new NewsEntity();
        newsEntity.title = news.title || findNews.title;
        newsEntity.description = news.description || findNews.description;
        newsEntity.cover = news.cover || findNews.cover;
        await this.newsRepository.update(id, newsEntity);
        return 'Новость успешна изменена!';
      }
      return null;
    } catch (error) {
      return new Error(`Произошла ошибка: ${error}`);
    }
  }
}
